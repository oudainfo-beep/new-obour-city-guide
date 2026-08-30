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
  "spa-obour": "السبا والاسترخاء", "clubs-obour": "الأندية",
  "car-rental-obour": "تأجير السيارات", "nutrition-obour": "أخصائيو التغذية",
  "mobile-repair-obour": "صيانة الموبايلات", "insurance-money-obour": "التأمين والحوالات",
  "parks-obour": "حدائق العبور", "schools-gov-vs-private": "حكومي أم خاص؟",
  "school-transport-obour": "باص المدرسة", "private-lessons-obour": "الدروس الخصوصية",
  "elderly-care-obour": "رعاية كبار السن", "driving-schools-obour": "تعليم القيادة",
  "pediatricians-obour": "أطباء الأطفال", "gynecologists-obour": "النساء والتوليد",
  "optics-obour": "البصريات والنظارات", "stationery-obour": "المكتبات المدرسية",
  "marble-ceramic-obour": "رخام وسيراميك", "ac-services-obour": "خدمات التكييف",
  "carpenters-obour": "النجارة", "painters-obour": "الدهانات",
  "blacksmiths-obour": "الحدادة", "wedding-services-obour": "تجهيزات الفرح",
  "gaming-cafes-obour": "مراكز الألعاب", "football-fields-obour": "ملاعب الكرة",
  "photographers-obour": "استوديوهات التصوير",
  "mortgage-finance-obour": "التمويل العقاري", "studio-sale-obour": "استوديو للبيع",
  "duplex-obour": "دوبلكس في العبور", "ground-floor-garden-obour": "أرضي بحديقة",
  "offplan-obour": "الشراء على الخريطة", "resale-obour": "إعادة البيع",
  "rental-yield-obour": "العائد الإيجاري", "tenant-rights-obour": "حقوق المستأجر",
  "rent-to-own-obour": "الإيجار المنتهي بالتملك", "social-housing-obour": "الإسكان الاجتماعي",
  "uber-obour": "أوبر وتطبيقات النقل", "airport-transfers-obour": "مشوار المطار",
  "parking-obour": "مواقف السيارات", "new-roads-obour": "الطرق الجديدة",
  "dermatologists-obour": "أطباء الجلدية", "orthopedists-obour": "أطباء العظام",
  "ent-obour": "الأنف والأذن", "psychiatrists-obour": "الصحة النفسية",
  "mri-obour": "الرنين المغناطيسي", "obour-specialized-hospital": "مستشفى العبور التخصصي",
  "home-nursing-obour": "التمريض المنزلي", "koshary-obour": "الكشري",
  "syrian-restaurants-obour": "المطبخ السوري", "specialty-coffee-obour": "القهوة المختصة",
  "butchers-obour": "الملاحم",
  "id-card-obour": "بطاقة الرقم القومي", "civil-registry-obour": "السجل المدني",
  "birth-certificates-obour": "شهادة الميلاد", "notary-obour": "التوثيق والشهر العقاري",
  "traffic-office-obour": "معاملات المرور", "padel-obour": "البادل",
  "swimming-obour": "تعليم السباحة", "martial-arts-obour": "الفنون القتالية",
  "yoga-obour": "يوجا وبيلاتس", "dance-classes-obour": "دروس الرقص",
  "pest-control-obour": "مكافحة الحشرات", "drain-cleaning-obour": "تسليك المجاري",
  "waterproofing-obour": "عزل الأسطح", "satellite-obour": "الستلايت",
  "cctv-obour": "كاميرات المراقبة", "solar-obour": "الطاقة الشمسية",
  "water-tanks-obour": "خزانات المياه", "gas-connection-obour": "الغاز الطبيعي",
  "electricity-meter-obour": "عداد الكهرباء", "tailors-obour": "الخياطون",
  "jewelry-obour": "الذهب والمجوهرات", "gifts-obour": "محلات الهدايا",
  "pet-shops-obour": "مستلزمات الحيوانات", "plant-nurseries-obour": "المشاتل",
  "upholstery-obour": "التنجيد",
};

const CLUSTERS = {
  housing: ["dar-misr-obour", "sakan-misr-obour", "villas-for-sale-obour", "installments-obour", "choose-apartment", "golf-city-obour", "quest-obour", "new-obour-real-estate", "price-forecast-obour", "commercial-real-estate", "mortgage-finance-obour", "studio-sale-obour", "duplex-obour", "ground-floor-garden-obour", "offplan-obour", "resale-obour", "rental-yield-obour", "rent-to-own-obour", "social-housing-obour"],
  districts: ["district-1", "district-2", "district-3", "district-4", "district-5", "district-6", "district-7", "district-8", "district-9", "best-districts"],
  rent: ["villas-rent-obour", "shops-rent-obour", "offices-rent-obour", "warehouses-obour", "furnished-apartments", "studio-rent-obour", "tenant-rights-obour"],
  transport: ["transport-from-cairo", "internal-transport", "middle-ring-road-obour", "day-trips", "nearby-cities", "uber-obour", "airport-transfers-obour", "new-roads-obour"],
  shopping: ["friday-market", "central-market", "supermarkets", "supermarkets-list", "carrefour-obour", "infinity-mall", "golf-city-mall", "new-obour-malls", "furniture-obour", "appliances-stores", "electronics-obour", "kitchens-obour", "kids-clothing", "clothing-stores", "building-materials"],
  health: ["hospital-24-hours", "pharmacies-24-hours", "labs-radiology", "labs-list", "dentists-obour", "vets-obour", "physical-therapy-obour", "new-obour-hospitals", "nutrition-obour", "pediatricians-obour", "gynecologists-obour", "elderly-care-obour", "optics-obour", "dermatologists-obour", "orthopedists-obour", "ent-obour", "psychiatrists-obour", "mri-obour", "obour-specialized-hospital", "home-nursing-obour", "swimming-obour", "martial-arts-obour", "yoga-obour", "padel-obour"],
  education: ["language-schools", "new-obour-schools", "japanese-school-obour", "universities-near-obour", "schools-gov-vs-private", "school-transport-obour", "private-lessons-obour", "stationery-obour", "dance-classes-obour"],
  life: ["moving-to-obour", "movers-obour", "telecom-obour", "postal-code", "post-offices", "jobs-obour", "obour-news", "obour-problems", "food-delivery", "restaurants-district-9", "car-service-centers", "tires-obour", "car-parts-obour", "car-dealers-obour", "plumbers-obour", "electricians-obour", "dry-clean-obour", "maintenance-companies", "shipping-companies", "lawyers-obour", "accountants-obour", "it-services-obour", "print-services", "gyms-obour", "beauty-salons-obour", "kids-activities", "wedding-halls", "parks-obour", "movers-obour", "car-rental-obour", "mobile-repair-obour", "insurance-money-obour", "driving-schools-obour", "marble-ceramic-obour", "ac-services-obour", "carpenters-obour", "painters-obour", "blacksmiths-obour", "wedding-services-obour", "gaming-cafes-obour", "football-fields-obour", "photographers-obour", "parking-obour", "koshary-obour", "syrian-restaurants-obour", "specialty-coffee-obour", "butchers-obour", "id-card-obour", "civil-registry-obour", "birth-certificates-obour", "notary-obour", "traffic-office-obour", "pest-control-obour", "drain-cleaning-obour", "waterproofing-obour", "satellite-obour", "cctv-obour", "solar-obour", "water-tanks-obour", "gas-connection-obour", "electricity-meter-obour", "tailors-obour", "jewelry-obour", "gifts-obour", "pet-shops-obour", "plant-nurseries-obour", "upholstery-obour"],
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
