import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cssPath = path.join(root, "client", "public", "static", "site.css");
let css = fs.readFileSync(cssPath, "utf8");
if (css.includes(".dir-list")) throw new Error("أنماط الأدلة مضافة بالفعل.");

css += `
/* أدلة الخدمات */
.dir-chips{display:flex;flex-wrap:wrap;gap:.4rem;margin:1.6rem 0 .4rem}
.dir-chips a{display:inline-flex;align-items:center;gap:.35rem;background:#e1eee7;border:1px solid #c5d9ca;color:#285535;text-decoration:none;padding:.4rem .6rem;font-size:.78rem;font-weight:800}
.dir-chips a:hover{background:#d3e6da}
.dir-chips b{background:var(--olive);color:#fff;font-size:.68rem;padding:.05rem .35rem}
.dir-group{margin-top:2.2rem;scroll-margin-top:90px}
.dir-group h3{display:flex;align-items:center;gap:.6rem;font:800 1.15rem Cairo,Arial,sans-serif;color:var(--deep);margin:0 0 .8rem;padding-bottom:.5rem;border-bottom:2px solid var(--teal)}
.dir-group h3 small{background:#dcebe3;color:#285535;font:800 .72rem Tajawal,Arial,sans-serif;padding:.15rem .45rem}
.dir-list{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line);border:1px solid var(--line)}
.dir-item{background:#fbfaf4;padding:.9rem 1rem;display:grid;gap:.25rem;align-content:start}
.dir-item h4{margin:0;font:800 .95rem/1.5 Cairo,Arial,sans-serif;color:var(--ink)}
.dir-en{margin:0;font-size:.72rem;color:#8a978e;direction:ltr;text-align:right}
.dir-addr{margin:0;font-size:.78rem;line-height:1.65;color:#5b6a61}
.dir-actions{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.35rem}
.dir-actions a{font-size:.75rem;font-weight:800;text-decoration:none;color:#285535;border-bottom:1px solid #8fb39f;padding-bottom:.05rem}
.dir-actions .dir-call{background:var(--olive);color:#fff;border:0;padding:.35rem .55rem;direction:ltr}
.dir-actions .dir-call:hover{background:#285535}
.dir-item small{color:#8a978e;font-size:.68rem}
.dir-hub{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line);border:1px solid var(--line);margin-top:1.6rem}
.dir-hub-card{position:relative;background:#fbfaf4;padding:1.4rem 1.2rem;text-decoration:none;color:var(--ink);display:grid;gap:.4rem;align-content:start;transition:background .18s,transform .18s}
.dir-hub-card:hover{background:#e8f0e8;transform:translateY(-3px)}
.dir-hub-card small{color:#83a591;font:800 .68rem Cairo,Arial,sans-serif}
.dir-hub-card b{font:800 1.05rem Cairo,Arial,sans-serif;color:var(--deep)}
.dir-hub-card span{font-size:.8rem;line-height:1.7;color:#66746c}
.dir-hub-card i{font-style:normal;font-weight:800;font-size:.78rem;color:var(--olive);margin-top:.3rem}
@media(max-width:1000px){.dir-list,.dir-hub{grid-template-columns:repeat(2,1fr)}}
@media(max-width:640px){.dir-list,.dir-hub{grid-template-columns:1fr}}
`;
fs.writeFileSync(cssPath, css);
console.log("تمت إضافة أنماط الأدلة.");
