/**
 * seo-phase32-internal-links.mjs
 * المرحلة 32 — شبكة روابط داخلية «أدلة ذات صلة» بين صفحات المحتوى الجديدة.
 *
 * كل صفحة تحصل على قسم «أدلة ذات صلة» قبل </main>:
 *   3 روابط من نفس التجميعة (تناوب ثابت بالفهرس — لا مجموعات متطابقة)
 *   + رابط من تجميعة شقيقة (سكن↔إيجار، صحة↔حياة يومية…)
 * idempotent (علامة data-related)، وتُدرج في سلسلة البناء بعد كل المراحل.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");

const TITLES = {
  "dar-misr-obour": "دار مصر في العبور", "sakan-misr-obour": "سكن مصر في العبور",
  "villas-for-sale-obour": "فيلات للبيع في العبور", "installments-obour": "شقق بالتقسيط",
  "choose-apartment": "كيف تختار شقتك", "golf-city-obour": "كمبوند جولف سيتي",
  "quest-obour": "مشروع كويست", "new-obour-real-estate": "عقارات العبور الجديدة",
  "price-forecast-obour": "قراءة اتجاهات الأسعار", "commercial-real-estate": "العقارات التجارية",
  "district-1": "الحي الأول", "district-2": "الحي الثاني", "district-3": "الحي الثالث",
  "district-4": "الحي الرابع", "district-5": "الحي الخامس", "district-6": "الحي السادس",
  "district-7": "الحي السابع", "district-8": "الحي الثامن", "district-9": "الحي التاسع",
  "best-districts": "أفضل الأحياء حسب احتياجك",
  "villas-rent-obour": "فيلات للإيجار", "shops-rent-obour": "محلات للإيجار",
  "offices-rent-obour": "مكاتب للإيجار", "warehouses-obour": "مخازن للإيجار",
  "furnished-apartments": "شقق مفروشة", "studio-rent-obour": "استوديو للإيجار",
  "transport-from-cairo": "مواصلات القاهرة-العبور", "internal-transport": "النقل الداخلي",
  "middle-ring-road-obour": "الدائري الأوسطي", "day-trips": "رحلات يوم واحد",
  "nearby-cities": "المدن القريبة",
  "friday-market": "سوق الجمعة", "central-market": "السوق المركزي",
  "supermarkets": "دليل الهايبر ماركت", "supermarkets-list": "قائمة السوبر ماركت",
  "carrefour-obour": "كارفور العبور", "infinity-mall": "انفينتي مول",
  "golf-city-mall": "جولف سيتي مول", "new-obour-malls": "مولات العبور الجديدة",
  "furniture-obour": "محلات الأثاث", "appliances-stores": "محلات الأجهزة",
  "electronics-obour": "محلات الإلكترونيات", "kitchens-obour": "محلات المطابخ",
  "kids-clothing": "ملابس الأطفال", "clothing-stores": "محلات الملابس",
  "building-materials": "عدد ومواد بناء",
  "hospital-24-hours": "خدمات طبية 24 ساعة", "pharmacies-24-hours": "صيدليات مناوبة",
  "labs-radiology": "معامل وأشعة", "labs-list": "قائمة معامل التحاليل",
  "dentists-obour": "عيادات الأسنان", "vets-obour": "عيادات بيطرية",
  "physical-therapy-obour": "علاج طبيعي", "new-obour-hospitals": "مستشفيات العبور الجديدة",
  "language-schools": "مدارس اللغات", "new-obour-schools": "مدارس العبور الجديدة",
  "japanese-school-obour": "المدرسة المصرية اليابانية", "universities-near-obour": "الجامعات القريبة",
  "moving-to-obour": "الانتقال إلى العبور", "movers-obour": "نقل العفش",
  "telecom-obour": "الإنترنت والاتصالات", "postal-code": "الرقم البريدي 11828",
  "post-offices": "مكاتب البريد", "jobs-obour": "وظائف العبور",
  "obour-news": "متابعة الأخبار الموثوقة", "obour-problems": "مشاكل المدينة وحلولها",
  "food-delivery": "دليفري العبور", "restaurants-district-9": "مطاعم الحي التاسع",
  "car-service-centers": "مراكز خدمة السيارات", "tires-obour": "محلات الإطارات",
  "car-parts-obour": "قطع غيار السيارات", "car-dealers-obour": "معارض السيارات",
  "plumbers-obour": "السباكون", "electricians-obour": "الكهربائيون",
  "dry-clean-obour": "مغاسل الدراي كلين", "maintenance-companies": "شركات الصيانة",
  "shipping-companies": "شركات الشحن", "lawyers-obour": "المحامون",
  "accountants-obour": "المحاسبون", "it-services-obour": "برمجيات وتسويق رقمي",
  "print-services": "طباعة وتصوير", "gyms-obour": "جيم ولياقة",
  "beauty-salons-obour": "صالونات التجميل", "kids-activities": "أنشطة الأطفال",
  "wedding-halls": "قاعات الأفراح",
  "en/nurseries": "Nurseries in Obour", "en/postal-code": "Obour postal code guide",
  "en/property-investment": "Property investment in Obour", "en/apartments-for-sale": "Apartments for sale in Obour",
  "en/cost-of-living": "Cost of living in Obour", "en/commuting-to-cairo": "Commuting Obour–Cairo",
  "en/obour-city-mall": "Obour City Mall guide", "en/international-schools": "International schools in Obour",
  "en/24-hour-pharmacies": "24-hour pharmacies in Obour",
};

const CLUSTERS = {
  housing: ["dar-misr-obour", "sakan-misr-obour", "villas-for-sale-obour", "installments-obour", "choose-apartment", "golf-city-obour", "quest-obour", "new-obour-real-estate", "price-forecast-obour", "commercial-real-estate"],
  districts: ["district-1", "district-2", "district-3", "district-4", "district-5", "district-6", "district-7", "district-8", "district-9", "best-districts"],
  rent: ["villas-rent-obour", "shops-rent-obour", "offices-rent-obour", "warehouses-obour", "furnished-apartments", "studio-rent-obour"],
  transport: ["transport-from-cairo", "internal-transport", "middle-ring-road-obour", "day-trips", "nearby-cities"],
  shopping: ["friday-market", "central-market", "supermarkets", "supermarkets-list", "carrefour-obour", "infinity-mall", "golf-city-mall", "new-obour-malls", "furniture-obour", "appliances-stores", "electronics-obour", "kitchens-obour", "kids-clothing", "clothing-stores", "building-materials"],
  health: ["hospital-24-hours", "pharmacies-24-hours", "labs-radiology", "labs-list", "dentists-obour", "vets-obour", "physical-therapy-obour", "new-obour-hospitals"],
  education: ["language-schools", "new-obour-schools", "japanese-school-obour", "universities-near-obour"],
  life: ["moving-to-obour", "movers-obour", "telecom-obour", "postal-code", "post-offices", "jobs-obour", "obour-news", "obour-problems", "food-delivery", "restaurants-district-9", "car-service-centers", "tires-obour", "car-parts-obour", "car-dealers-obour", "plumbers-obour", "electricians-obour", "dry-clean-obour", "maintenance-companies", "shipping-companies", "lawyers-obour", "accountants-obour", "it-services-obour", "print-services", "gyms-obour", "beauty-salons-obour", "kids-activities", "wedding-halls"],
  en: ["en/nurseries", "en/postal-code", "en/property-investment", "en/apartments-for-sale", "en/cost-of-living", "en/commuting-to-cairo", "en/obour-city-mall", "en/international-schools", "en/24-hour-pharmacies"],
};

// تجميعات شقيقة للربط العرضي
const SIBLING = {
  housing: "rent", rent: "housing", districts: "housing", transport: "life",
  shopping: "life", health: "life", education: "life", life: "shopping", en: "en",
};

function linksFor(slug) {
  const clusterName = Object.keys(CLUSTERS).find((k) => CLUSTERS[k].includes(slug));
  if (!clusterName) return null;
  const cluster = CLUSTERS[clusterName].filter((s) => s !== slug);
  const idx = CLUSTERS[clusterName].indexOf(slug);
  const picked = [];
  for (let i = 1; i <= cluster.length && picked.length < 3; i++) {
    picked.push(cluster[(idx + i - 1) % cluster.length]);
  }
  const siblingCluster = CLUSTERS[SIBLING[clusterName]] || [];
  if (siblingCluster.length && clusterName !== "en") {
    picked.push(siblingCluster[idx % siblingCluster.length]);
  } else if (clusterName === "en") {
    picked.push(cluster[(idx + 4) % cluster.length]);
  }
  return [...new Set(picked)].slice(0, 4);
}

function blockFor(slug, links) {
  const isEn = slug.startsWith("en/");
  const h2 = isEn ? "Related guides" : "أدلة ذات صلة";
  const items = links
    .map((s) => `<li><a href="/${s}/">${TITLES[s] || s}</a></li>`)
    .join("");
  return `<section class="section" data-related="32"><div class="wrap"><h2>${h2}</h2><ul>${items}</ul></div></section>`;
}

function main() {
  let added = 0, skipped = 0, missing = 0;
  for (const slug of Object.keys(TITLES)) {
    const p = path.join(clientDir, slug, "index.html");
    if (!fs.existsSync(p)) { missing++; continue; }
    let html = fs.readFileSync(p, "utf8");
    if (html.includes('data-related="32"')) { skipped++; continue; }
    const links = linksFor(slug);
    if (!links || !html.includes("</main>")) { missing++; continue; }
    html = html.replace("</main>", blockFor(slug, links) + "</main>");
    fs.writeFileSync(p, html, "utf8");
    added++;
  }
  console.log(`Phase 32 internal links: ${added} pages got related-guides, ${skipped} already had, ${missing} skipped/missing`);
}

main();
