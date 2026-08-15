import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generatorPath = path.join(root, "scripts", "render-static.mjs");
let source = fs.readFileSync(generatorPath, "utf8");

source = source.replace(/\["\/([a-z-]+)\//g, '["/$1/index.html');
source = source.replace(/href="\/(?!static\/)([a-z-]+)\//g, 'href="/$1/index.html');
source = source.replaceAll("${site}/${slug}/", "${site}/${slug}/index.html");
source = source.replace('const active = slug ? `/${slug}/` : "/";', 'const active = slug ? `/${slug}/index.html` : "/";');

if (!source.includes('["/schools/index.html", "المدارس"]') || !source.includes('${site}/${slug}/index.html')) {
  throw new Error("The generated page links or canonical URLs were not updated as expected.");
}

fs.writeFileSync(generatorPath, source);
console.log("Updated internal links, canonical URLs, and sitemap entries to direct static HTML artifacts.");
