/**
 * server/qa.ts — مجتمع الأسئلة والأجوبة (Reddit/Quora-lite).
 *
 * - Express router يُركَّب على /api/qa
 * - MySQL عبر mysql2 (موجودة في الاعتماديات) — الجداول تُنشأ تلقائيًا عند الإقلاع
 * - تسجيل بالبريد وكلمة مرور (scrypt) + جلسة كوكي httpOnly
 * - القراءة عامة للجميع؛ النشر للمسجلين فقط؛ حذف للمشرف (ADMIN_EMAIL)
 */
import { Router } from "express";
import crypto from "node:crypto";
import mysql from "mysql2/promise";
import type { Pool } from "mysql2/promise";

let pool: Pool | null = null;
function getPool(): Pool | null {
  if (!pool && process.env.DATABASE_URL) {
    try {
      pool = mysql.createPool(process.env.DATABASE_URL);
    } catch (e) {
      console.warn("[QA] DB connect failed:", (e as Error).message);
      pool = null;
    }
  }
  return pool;
}

async function ensureTables() {
  const db = getPool();
  if (!db) return;
  const ddl = [
    `CREATE TABLE IF NOT EXISTS qa_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(320) NOT NULL UNIQUE,
      pass_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS qa_sessions (
      token_hash CHAR(64) PRIMARY KEY,
      user_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at BIGINT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS qa_questions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      topic VARCHAR(160) NOT NULL,
      title VARCHAR(300) NOT NULL,
      body TEXT,
      user_id INT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'open',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_topic (topic)
    )`,
    `CREATE TABLE IF NOT EXISTS qa_answers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      question_id INT NOT NULL,
      body TEXT NOT NULL,
      user_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_q (question_id)
    )`,
    `CREATE TABLE IF NOT EXISTS qa_votes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      target_type VARCHAR(10) NOT NULL,
      target_id INT NOT NULL,
      value TINYINT NOT NULL,
      UNIQUE KEY uq_vote (user_id, target_type, target_id)
    )`,
  ];
  for (const q of ddl) await db.query(q);
}

// ---------- auth helpers ----------
function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
function verifyPassword(pw: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(pw, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(test, "hex"));
}
const hashToken = (t: string) => crypto.createHash("sha256").update(t).digest("hex");

function parseCookies(req: any): Record<string, string> {
  const out: Record<string, string> = {};
  const raw = req.headers.cookie || "";
  for (const part of raw.split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

async function currentUser(req: any) {
  const db = getPool();
  if (!db) return null;
  const token = parseCookies(req).qa_session;
  if (!token) return null;
  const [rows]: any = await db.query(
    `SELECT u.id, u.name, u.email, u.role FROM qa_sessions s
     JOIN qa_users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ?`,
    [hashToken(token), Date.now()]
  );
  return rows[0] || null;
}

async function makeSession(res: any, userId: number) {
  const db = getPool()!;
  const token = crypto.randomBytes(32).toString("base64url");
  await db.query("INSERT INTO qa_sessions (token_hash, user_id, expires_at) VALUES (?,?,?)",
    [hashToken(token), userId, Date.now() + 30 * 864e5]);
  res.setHeader("Set-Cookie",
    `qa_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 86400}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
}

const clean = (s: unknown, max: number) =>
  String(s ?? "").replace(/<[^>]*>/g, "").trim().slice(0, max);

async function voteScore(db: Pool, type: string, id: number): Promise<number> {
  const [r]: any = await db.query(
    "SELECT COALESCE(SUM(value),0) AS s FROM qa_votes WHERE target_type=? AND target_id=?", [type, id]);
  return Number(r[0].s);
}

export function qaRouter(): Router {
  const r = Router();
  r.use(async (_req, _res, next) => { await ensureTables(); next(); });

  // ---- auth ----
  r.post("/register", async (req, res) => {
    const db = getPool();
    if (!db) return res.status(503).json({ error: "قاعدة البيانات غير متاحة" });
    const name = clean(req.body?.name, 120);
    const email = clean(req.body?.email, 320).toLowerCase();
    const password = String(req.body?.password || "");
    if (!name || !email.includes("@") || password.length < 8)
      return res.status(400).json({ error: "بيانات غير مكتملة: الاسم والبريد وكلمة مرور 8 أحرف على الأقل" });
    const role = process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL.toLowerCase() ? "admin" : "user";
    try {
      const [result]: any = await db.query(
        "INSERT INTO qa_users (name, email, pass_hash, role) VALUES (?,?,?,?)",
        [name, email, hashPassword(password), role]);
      await makeSession(res, result.insertId);
      res.json({ ok: true, user: { id: result.insertId, name, role } });
    } catch (e: any) {
      if (String(e.code) === "ER_DUP_ENTRY") return res.status(409).json({ error: "هذا البريد مسجل بالفعل — جرّب تسجيل الدخول" });
      res.status(500).json({ error: "تعذر إنشاء الحساب" });
    }
  });

  r.post("/login", async (req, res) => {
    const db = getPool();
    if (!db) return res.status(503).json({ error: "قاعدة البيانات غير متاحة" });
    const email = clean(req.body?.email, 320).toLowerCase();
    const password = String(req.body?.password || "");
    const [rows]: any = await db.query("SELECT * FROM qa_users WHERE email=?", [email]);
    const user = rows[0];
    if (!user || !verifyPassword(password, user.pass_hash))
      return res.status(401).json({ error: "البريد أو كلمة المرور غير صحيحة" });
    await makeSession(res, user.id);
    res.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } });
  });

  r.post("/logout", async (req, res) => {
    const db = getPool();
    const token = parseCookies(req).qa_session;
    if (db && token) await db.query("DELETE FROM qa_sessions WHERE token_hash=?", [hashToken(token)]);
    res.setHeader("Set-Cookie", "qa_session=; Path=/; HttpOnly; Max-Age=0");
    res.json({ ok: true });
  });

  r.get("/me", async (req, res) => {
    const user = await currentUser(req);
    res.json({ user: user ? { id: user.id, name: user.name, role: user.role } : null });
  });

  // ---- questions (read = public) ----
  r.get("/questions", async (req, res) => {
    const db = getPool();
    if (!db) return res.status(503).json({ error: "قاعدة البيانات غير متاحة" });
    const topic = clean(req.query.topic, 160);
    const [rows]: any = topic
      ? await db.query(
          `SELECT q.*, u.name AS author,
             (SELECT COUNT(*) FROM qa_answers a WHERE a.question_id=q.id) AS answers,
             (SELECT COALESCE(SUM(v.value),0) FROM qa_votes v WHERE v.target_type='q' AND v.target_id=q.id) AS score
           FROM qa_questions q JOIN qa_users u ON u.id=q.user_id
           WHERE q.topic=? ORDER BY q.created_at DESC LIMIT 100`, [topic])
      : await db.query(
          `SELECT q.*, u.name AS author,
             (SELECT COUNT(*) FROM qa_answers a WHERE a.question_id=q.id) AS answers,
             (SELECT COALESCE(SUM(v.value),0) FROM qa_votes v WHERE v.target_type='q' AND v.target_id=q.id) AS score
           FROM qa_questions q JOIN qa_users u ON u.id=q.user_id
           ORDER BY q.created_at DESC LIMIT 100`);
    res.json({ questions: rows });
  });

  r.get("/topics", async (_req, res) => {
    const db = getPool();
    if (!db) return res.status(503).json({ error: "قاعدة البيانات غير متاحة" });
    const [rows]: any = await db.query(
      `SELECT topic, COUNT(*) AS count FROM qa_questions GROUP BY topic ORDER BY count DESC LIMIT 100`);
    res.json({ topics: rows });
  });

  r.get("/questions/:id", async (req, res) => {
    const db = getPool();
    if (!db) return res.status(503).json({ error: "قاعدة البيانات غير متاحة" });
    const id = Number(req.params.id);
    const [qs]: any = await db.query(
      `SELECT q.*, u.name AS author FROM qa_questions q JOIN qa_users u ON u.id=q.user_id WHERE q.id=?`, [id]);
    if (!qs[0]) return res.status(404).json({ error: "السؤال غير موجود" });
    const [answers]: any = await db.query(
      `SELECT a.*, u.name AS author,
        (SELECT COALESCE(SUM(v.value),0) FROM qa_votes v WHERE v.target_type='a' AND v.target_id=a.id) AS score
       FROM qa_answers a JOIN qa_users u ON u.id=a.user_id
       WHERE a.question_id=? ORDER BY score DESC, a.created_at ASC`, [id]);
    res.json({ question: { ...qs[0], score: await voteScore(db, "q", id) }, answers });
  });

  // ---- writes (registered only) ----
  r.post("/questions", async (req, res) => {
    const user = await currentUser(req);
    if (!user) return res.status(401).json({ error: "سجّل دخولك أولًا لتنشر سؤالك" });
    const db = getPool()!;
    const topic = clean(req.body?.topic, 160) || "عام";
    const title = clean(req.body?.title, 300);
    const body = clean(req.body?.body, 5000);
    if (title.length < 10) return res.status(400).json({ error: "السؤال قصير جدًا — اكتب عنوانًا من 10 أحرف على الأقل" });
    const [result]: any = await db.query(
      "INSERT INTO qa_questions (topic, title, body, user_id) VALUES (?,?,?,?)",
      [topic, title, body, user.id]);
    res.json({ ok: true, id: result.insertId });
  });

  r.post("/questions/:id/answers", async (req, res) => {
    const user = await currentUser(req);
    if (!user) return res.status(401).json({ error: "سجّل دخولك أولًا لتنشر إجابتك" });
    const db = getPool()!;
    const qid = Number(req.params.id);
    const body = clean(req.body?.body, 5000);
    if (body.length < 5) return res.status(400).json({ error: "الإجابة قصيرة جدًا" });
    const [result]: any = await db.query(
      "INSERT INTO qa_answers (question_id, body, user_id) VALUES (?,?,?)", [qid, body, user.id]);
    res.json({ ok: true, id: result.insertId });
  });

  r.post("/vote", async (req, res) => {
    const user = await currentUser(req);
    if (!user) return res.status(401).json({ error: "سجّل دخولك للتصويت" });
    const db = getPool()!;
    const type = req.body?.target_type === "a" ? "a" : "q";
    const id = Number(req.body?.target_id);
    const value = Number(req.body?.value) >= 0 ? 1 : -1;
    await db.query(
      `INSERT INTO qa_votes (user_id, target_type, target_id, value) VALUES (?,?,?,?)
       ON DUPLICATE KEY UPDATE value=VALUES(value)`, [user.id, type, id, value]);
    res.json({ ok: true, score: await voteScore(db, type, id) });
  });

  // ---- moderation (admin) ----
  r.delete("/questions/:id", async (req, res) => {
    const user = await currentUser(req);
    if (!user || user.role !== "admin") return res.status(403).json({ error: "للمشرف فقط" });
    const db = getPool()!;
    const id = Number(req.params.id);
    await db.query("DELETE FROM qa_answers WHERE question_id=?", [id]);
    await db.query("DELETE FROM qa_votes WHERE target_type='q' AND target_id=?", [id]);
    await db.query("DELETE FROM qa_questions WHERE id=?", [id]);
    res.json({ ok: true });
  });

  r.delete("/answers/:id", async (req, res) => {
    const user = await currentUser(req);
    if (!user || user.role !== "admin") return res.status(403).json({ error: "للمشرف فقط" });
    const db = getPool()!;
    await db.query("DELETE FROM qa_votes WHERE target_type='a' AND target_id=?", [Number(req.params.id)]);
    await db.query("DELETE FROM qa_answers WHERE id=?", [Number(req.params.id)]);
    res.json({ ok: true });
  });

  return r;
}
