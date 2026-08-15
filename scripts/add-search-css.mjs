import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cssPath = path.join(root, "client", "public", "static", "site.css");
let css = fs.readFileSync(cssPath, "utf8");

if (css.includes(".site-search")) throw new Error("أنماط البحث مضافة بالفعل.");

css += `
/* بحث الهيدر وصفحة البحث وبطاقات الطوارئ */
.site-search{display:flex;align-items:center;gap:0;flex:none;border:1px solid #b6c9ba;background:#fbfaf4}
.site-search input{border:0;background:transparent;padding:.55rem .7rem;font:600 .8rem Tajawal,Arial,sans-serif;color:var(--ink);width:170px;outline:none}
.site-search input::placeholder{color:#8a9a8e}
.site-search button{border:0;background:var(--olive);color:#fff;font-size:1rem;line-height:1;padding:.6rem .7rem;cursor:pointer}
.site-search button:hover{background:#285535}
.search-page-form{display:flex;gap:.5rem;margin-bottom:1rem;flex-wrap:wrap}
.search-page-form input{flex:1;min-width:240px;border:1px solid #b6c9ba;background:#fbfaf4;padding:.85rem 1rem;font:600 1rem Tajawal,Arial,sans-serif;color:var(--ink)}
.search-page-form button{border:1px solid var(--olive);background:var(--olive);color:#fff;font:800 .9rem Cairo,Arial,sans-serif;padding:.85rem 1.6rem;cursor:pointer}
.search-page-form button:hover{background:#285535}
#search-results{margin-top:1.4rem}
#search-results .school-card a{color:var(--deep);text-decoration:none;border-bottom:1px solid #8fb39f}
.emergency-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line);border:1px solid var(--line);margin-top:1.4rem}
.emergency-card{display:grid;gap:.2rem;place-items:center;text-align:center;background:#fbfaf4;padding:1.5rem .8rem;text-decoration:none;color:var(--ink);transition:background .18s,transform .18s}
.emergency-card:hover{background:#e8f0e8;transform:translateY(-3px)}
.emergency-card b{font:800 2.1rem/1 Cairo,Arial,sans-serif;color:var(--olive);letter-spacing:-.04em;direction:ltr}
.emergency-card span{font-size:.86rem;font-weight:700;color:#4d5a52}
@media(max-width:1000px){.site-search{display:none}.emergency-grid{grid-template-columns:repeat(3,1fr)}}
@media(max-width:640px){.emergency-grid{grid-template-columns:repeat(2,1fr)}.emergency-card{padding:1.15rem .5rem}.emergency-card b{font-size:1.75rem}}
`;

fs.writeFileSync(cssPath, css);
console.log("تمت إضافة أنماط البحث والطوارئ.");
