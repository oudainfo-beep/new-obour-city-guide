/* qa.js — مجتمع أسئلة العبور: صندوق تحت كل دليل + قسم /ask/ */
(function () {
  "use strict";
  var API = "/api/qa";
  var me = null;

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmt(ts) {
    try { return new Date(ts).toLocaleDateString("ar-EG-u-nu-latn", { year: "numeric", month: "long", day: "numeric" }); }
    catch (e) { return ""; }
  }
  async function api(path, opts) {
    var res = await fetch(API + path, Object.assign({ credentials: "same-origin" }, opts || {}));
    var data = {};
    try { data = await res.json(); } catch (e) {}
    if (!res.ok) throw new Error(data.error || "حدث خطأ — حاول مرة أخرى");
    return data;
  }
  async function loadMe() {
    try { me = (await api("/me")).user; } catch (e) { me = null; }
    renderAuthChip();
  }

  // ---------- auth modal ----------
  function authModal() {
    var m = document.getElementById("qa-auth");
    if (m) return m;
    m = document.createElement("div");
    m.id = "qa-auth";
    m.className = "qa-auth";
    m.innerHTML =
      '<div class="qa-auth-card"><button class="qa-close" aria-label="إغلاق">×</button>' +
      "<h3>انضم لمجتمع العبور</h3>" +
      '<div class="qa-tabs"><button data-t="login" class="on">دخول</button><button data-t="register">حساب جديد</button></div>' +
      '<div class="qa-auth-body"></div><div class="qa-msg"></div></div>';
    document.body.appendChild(m);
    m.querySelector(".qa-close").onclick = function () { m.classList.remove("open"); };
    m.addEventListener("click", function (e) { if (e.target === m) m.classList.remove("open"); });
    m.querySelectorAll(".qa-tabs button").forEach(function (b) {
      b.onclick = function () {
        m.querySelectorAll(".qa-tabs button").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        renderAuthForm(b.dataset.t);
      };
    });
    return m;
  }
  function renderAuthForm(mode) {
    var m = authModal();
    var body = m.querySelector(".qa-auth-body");
    body.innerHTML =
      (mode === "register" ? '<input id="qa-name" placeholder="اسمك (يظهر مع مشاركاتك)">' : "") +
      '<input id="qa-email" type="email" placeholder="البريد الإلكتروني">' +
      '<input id="qa-pass" type="password" placeholder="كلمة المرور (8 أحرف على الأقل)">' +
      '<button class="qa-btn" style="width:100%">' + (mode === "register" ? "إنشاء الحساب" : "تسجيل الدخول") + "</button>";
    body.querySelector(".qa-btn").onclick = async function () {
      var msg = m.querySelector(".qa-msg");
      msg.className = "qa-msg"; msg.textContent = "…";
      try {
        var payload = { email: document.getElementById("qa-email").value, password: document.getElementById("qa-pass").value };
        if (mode === "register") payload.name = document.getElementById("qa-name").value;
        var data = await api(mode === "register" ? "/register" : "/login", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
        });
        me = data.user;
        msg.className = "qa-msg ok"; msg.textContent = "أهلًا بك يا " + me.name + "!";
        setTimeout(function () { m.classList.remove("open"); }, 700);
        renderAuthChip();
        document.querySelectorAll(".qa-box").forEach(loadBox);
      } catch (e) { msg.className = "qa-msg"; msg.textContent = e.message; }
    };
  }
  function openAuth() { authModal().classList.add("open"); renderAuthForm("login"); }

  function renderAuthChip() {
    document.querySelectorAll(".qa-user-area").forEach(function (el) {
      if (me) {
        el.innerHTML = '<span class="qa-user-chip">👤 ' + esc(me.name) + (me.role === "admin" ? " · مشرف" : "") + " · خروج</span>";
        el.querySelector(".qa-user-chip").onclick = async function () {
          await api("/logout", { method: "POST" }); me = null; renderAuthChip();
          document.querySelectorAll(".qa-box").forEach(loadBox);
        };
      } else {
        el.innerHTML = '<button class="qa-btn ghost">سجّل لتشارك</button>';
        el.querySelector("button").onclick = openAuth;
      }
    });
  }

  // ---------- question box ----------
  async function vote(type, id, btn) {
    try {
      var data = await api("/vote", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_type: type, target_id: id, value: btn.dataset.v || 1 }) });
      btn.closest(".qa-q, .qa-a").querySelector(".qa-score").textContent = data.score;
    } catch (e) { if (/سجّل/.test(e.message)) openAuth(); else alert(e.message); }
  }

  async function loadBox(box) {
    var topic = box.dataset.topic;
    var list = box.querySelector(".qa-list");
    list.innerHTML = '<div class="qa-empty">يحمّل الأسئلة…</div>';
    try {
      var data = await api("/questions?topic=" + encodeURIComponent(topic));
      if (!data.questions.length) {
        list.innerHTML = '<div class="qa-empty">لا أسئلة بعد عن هذا الموضوع — كن أول من يسأل 👋</div>';
        return;
      }
      list.innerHTML = "";
      data.questions.forEach(function (q) {
        var div = document.createElement("div");
        div.className = "qa-q";
        div.innerHTML =
          '<div class="qa-q-title"><button class="qa-vote" data-v="1">▲</button> <span class="qa-score">' + q.score + "</span> " + esc(q.title) + "</div>" +
          '<div class="qa-meta">' + esc(q.author) + " · " + fmt(q.created_at) + ' · <span class="qa-toggle" style="cursor:pointer;color:#1d4ed8">' + q.answers + " إجابة — عرض/أجب</span>" +
          (me && me.role === "admin" ? ' · <span class="qa-del" style="cursor:pointer;color:#b91c1c">حذف</span>' : "") + "</div>" +
          '<div class="qa-answers" style="display:none"></div>';
        div.querySelector(".qa-vote").onclick = function () { vote("q", q.id, this); };
        div.querySelector(".qa-toggle").onclick = function () { toggleAnswers(div, q); };
        var del = div.querySelector(".qa-del");
        if (del) del.onclick = async function () {
          if (!confirm("حذف هذا السؤال وكل إجاباته؟")) return;
          await api("/questions/" + q.id, { method: "DELETE" }); loadBox(box);
        };
        list.appendChild(div);
      });
    } catch (e) {
      list.innerHTML = '<div class="qa-empty">المجتمع يبدأ قريبًا — الخدمة قيد التشغيل.</div>';
    }
  }

  async function toggleAnswers(div, q) {
    var wrap = div.querySelector(".qa-answers");
    if (wrap.style.display === "block") { wrap.style.display = "none"; return; }
    wrap.style.display = "block";
    wrap.innerHTML = "<small>يحمّل…</small>";
    var data = await api("/questions/" + q.id);
    var html = "";
    if (data.question.body) html += '<div class="qa-a"><small>تفاصيل السؤال:</small><br>' + esc(data.question.body) + "</div>";
    data.answers.forEach(function (a) {
      html += '<div class="qa-a"><button class="qa-vote" data-v="1">▲</button> <span class="qa-score">' + a.score + "</span> " +
        esc(a.body) + ' <small>— ' + esc(a.author) + " · " + fmt(a.created_at) + "</small>" +
        (me && me.role === "admin" ? ' <span class="qa-del-a" data-id="' + a.id + '" style="cursor:pointer;color:#b91c1c">حذف</span>' : "") + "</div>";
    });
    html += me
      ? '<textarea id="qa-ans-' + q.id + '" placeholder="اكتب إجابتك…" style="width:100%;box-sizing:border-box;min-height:70px;margin-top:.5rem;font-family:inherit;padding:.6rem;border:1px solid #cbd5e1;border-radius:10px"></textarea><button class="qa-btn qa-ans-btn" data-q="' + q.id + '">انشر إجابتك</button>'
      : '<div class="qa-meta" style="margin-top:.6rem">سجّل دخولك لتشارك بإجابة 👇</div>';
    wrap.innerHTML = html;
    wrap.querySelectorAll(".qa-a .qa-vote").forEach(function (b, i) {
      b.onclick = function () { vote("a", data.answers[i].id, b); };
    });
    wrap.querySelectorAll(".qa-del-a").forEach(function (d) {
      d.onclick = async function () { await api("/answers/" + d.dataset.id, { method: "DELETE" }); toggleAnswers(div, q); toggleAnswers(div, q); };
    });
    var btn = wrap.querySelector(".qa-ans-btn");
    if (btn) btn.onclick = async function () {
      var ta = wrap.querySelector("textarea");
      try {
        await api("/questions/" + q.id + "/answers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: ta.value }) });
        toggleAnswers(div, q); toggleAnswers(div, q);
        document.querySelectorAll(".qa-box").forEach(loadBox);
      } catch (e) { alert(e.message); }
    };
    if (!me) wrap.querySelector(".qa-meta").style.cursor = "pointer", wrap.querySelector(".qa-meta").onclick = openAuth;
  }

  // ---------- boot: article boxes ----------
  document.querySelectorAll(".qa-box").forEach(function (box) {
    box.innerHTML =
      '<div class="qa-head"><div><b>❓ أسئلة وأجوبة المجتمع</b><small>اسأل أهل العبور وأجب على غيرك — كـ Quora وخرائط جوجل</small></div>' +
      '<div style="display:flex;gap:.6rem;align-items:center"><span class="qa-user-area"></span><button class="qa-btn qa-ask">اسأل سؤالًا</button></div></div>' +
      '<div class="qa-list"></div>' +
      '<div class="qa-form"><input class="qa-q-input" placeholder="عنوان سؤالك — مثال: أفضل حضانة قريبة من الحي التاسع؟">' +
      '<textarea class="qa-q-body" placeholder="تفاصيل إضافية (اختياري)…"></textarea>' +
      '<button class="qa-btn qa-send">انشر السؤال</button> <div class="qa-msg"></div></div>';
    box.querySelector(".qa-ask").onclick = function () {
      if (!me) return openAuth();
      box.querySelector(".qa-form").classList.toggle("open");
    };
    box.querySelector(".qa-send").onclick = async function () {
      var msg = box.querySelector(".qa-msg");
      try {
        await api("/questions", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: box.dataset.topic, title: box.querySelector(".qa-q-input").value, body: box.querySelector(".qa-q-body").value }) });
        box.querySelector(".qa-q-input").value = ""; box.querySelector(".qa-q-body").value = "";
        box.querySelector(".qa-form").classList.remove("open");
        loadBox(box);
      } catch (e) { msg.className = "qa-msg"; msg.textContent = e.message; }
    };
    loadBox(box);
  });

  // ---------- /ask/ community board ----------
  var board = document.getElementById("qa-board");
  if (board) {
    (async function () {
      var latest = board.querySelector(".qa-board-latest");
      try {
        var data = await api("/questions");
        if (!data.questions.length) {
          latest.innerHTML = '<div class="qa-empty">المجتمع في بدايته — كن صاحب أول سؤال! اختر موضوعًا من الأعلى أو اسأل من أي صفحة دليل.</div>';
          return;
        }
        latest.innerHTML = "";
        data.questions.forEach(function (q) {
          var row = document.createElement("div");
          row.className = "qa-topic-row";
          row.innerHTML = "<a href=\"" + "/" + encodeURIComponent(q.topic) + "/\">" + esc(q.title) + "</a><small>" + esc(q.author) + " · " + fmt(q.created_at) + " · " + q.answers + " إجابة · " + q.score + " نقطة</small>";
          latest.appendChild(row);
        });
      } catch (e) {
        latest.innerHTML = '<div class="qa-empty">لوحة المجتمع تبدأ مع تشغيل الخادم — تحقق لاحقًا.</div>';
      }
    })();
  }

  loadMe();
})();
