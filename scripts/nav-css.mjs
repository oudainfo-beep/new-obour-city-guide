import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cssPath = path.join(root, "client", "public", "static", "site.css");
let css = fs.readFileSync(cssPath, "utf8");
if (css.includes(".nav-has-drop")) throw new Error("أنماط التنقل مضافة بالفعل.");

css += `
/* تنقل بقوائم منسدلة — بلا JavaScript */
.desktop-nav{gap:.15rem}
.nav-item{position:relative}
.nav-item>a,.nav-top{display:inline-flex;align-items:center;gap:.25rem;padding:.55rem .6rem;font-weight:800;font-size:.82rem;color:#3d4b42;text-decoration:none;cursor:pointer;white-space:nowrap}
.nav-item>a:hover,.nav-top:hover,.nav-item>a[aria-current=page]{background:#e1ece2;color:#17472d;box-shadow:inset 0 -2px var(--olive)}
.nav-top i{font-style:normal;font-size:.68rem;color:var(--olive)}
.nav-accent>a{color:#8f2f2f}
.nav-accent>a:hover{background:#f6e5e2;color:#7a2020;box-shadow:inset 0 -2px #8f2f2f}
.nav-open>.nav-top{background:#e1ece2;color:#17472d;box-shadow:inset 0 -2px var(--olive)}
.nav-drop{position:absolute;top:100%;right:0;z-index:20;display:none;min-width:230px;background:var(--paper);border:1px solid #c3d3c6;box-shadow:0 16px 38px rgba(36,62,44,.16);padding:.4rem}
.nav-drop-wide{min-width:520px;display:none;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 .2rem}
.nav-has-drop:hover>.nav-drop,.nav-has-drop:focus-within>.nav-drop{display:block}
.nav-has-drop:hover>.nav-drop-wide,.nav-has-drop:focus-within>.nav-drop-wide{display:grid}
.nav-drop a{display:block;padding:.5rem .6rem;font-size:.8rem;font-weight:700;color:#3d4b42;text-decoration:none;border-bottom:1px solid #e2e8e1}
.nav-drop a:last-child{border-bottom:0}
.nav-drop a:hover,.nav-drop a[aria-current=page]{background:#e1ece2;color:#17472d}
.nav-drop-wide a:first-child{grid-column:1/-1;background:#dcebe3;color:#17472d;font-weight:800}
/* قائمة الموبايل */
.mobile-menu nav{width:min(320px,88vw);max-height:78vh;overflow:auto;padding:.6rem}
.m-search{display:flex;margin-bottom:.5rem;border:1px solid #b6c9ba;background:#fbfaf4}
.m-search input{flex:1;border:0;background:transparent;padding:.6rem;font:600 .85rem 'IBM Plex Sans Arabic',Arial,sans-serif;outline:none}
.m-search button{border:0;background:var(--olive);color:#fff;padding:.6rem .8rem;font-size:1rem;cursor:pointer}
.mobile-menu .m-solo{display:block;padding:.7rem .6rem;font-weight:800;color:var(--ink);text-decoration:none;border-bottom:1px solid var(--line)}
.m-group{border-bottom:1px solid var(--line)}
.m-group summary{list-style:none;padding:.7rem .6rem;font-weight:800;color:var(--ink);cursor:pointer;display:flex;justify-content:space-between;align-items:center}
.m-group summary::-webkit-details-marker{display:none}
.m-group summary::after{content:"▾";color:var(--olive);font-size:.75rem}
.m-group[open] summary::after{content:"▴"}
.m-group>div{padding:0 0 .5rem .6rem}
.m-group>div a{display:block;padding:.45rem .6rem;font-size:.82rem;font-weight:700;color:#4a5a50;text-decoration:none;border-bottom:1px dashed #dbe3da}
.m-group>div a:last-child{border-bottom:0}
.m-group>div a[aria-current=page]{color:#17472d;background:#e1ece2}
@media(max-width:1180px){.nav-item>a,.nav-top{padding:.5rem .45rem;font-size:.78rem}}
`;
fs.writeFileSync(cssPath, css);
console.log("تمت إضافة أنماط التنقل.");
