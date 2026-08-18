/**
 * seo-phase7-faq-expand.mjs
 * إضافة أسئلة محلية شائعة إلى صفحة /faq/ مع تحديث FAQPage schema.
 *
 * idempotent: محمي بعلامة <!-- phase7-faq-expand -->.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pagePath = path.join(root, "client", "faq", "index.html");

const MARKER = "<!-- phase7-faq-expand -->";

const NEW_QUESTIONS = [
  {
    q: "كم تبعد العبور عن مدينة نصر؟",
    a: "لا يوجد رقم ثابت يُنشر كمسافة رسمية؛ الزمن يعتمد على نقطة الانطلاق في العبور، الوجهة في مدينة نصر، والوقت واليوم. الطريقة الوحيدة الموثوقة هي قياس الرحلة بنفسك من الموقع المعين في ساعات الذروة والازدحام."
  },
  {
    q: "كم تبعد العبور الجديدة عن القاهرة؟",
    a: "تقع العبور الجديدة شرق القاهرة ضمن محافظة القليوبية، لكن المسافة الفعلية تختلف حسب المحور المستخدم ونقطة البداية والنهاية. لا تعتمد على أرقام تسويقية عامة؛ قيّس الزمن الفعلي من موقع الوحدة إلى وجهتك المعتادة."
  },
  {
    q: "أقرب مستشفى من العبور الجديدة؟",
    a: "القرب يعتمد على الحي داخل العبور الجديدة. بعض المناطق تكون أقرب إلى مرافق العبور القائمة، وبعضها يحتاج مسافة أطول. استخدم <a href='/hospitals/'>دليل المستشفيات</a> وابحث عن العنوان الأقرب لموقعك، ثم قسّ زمن الوصول في ساعة الذروة."
  },
  {
    q: "ما مواعيد جهاز مدينة العبور الجديدة؟",
    a: "مواعيد الجهاز تُعلن عبر الموقع الرسمي لهيئة المجتمعات العمرانية الجديدة أو من خلال الاتصال بالجهاز مباشرة. لا تعتمد على مواعيد منشورة على مواقع وسيطة دون التحقق من المصدر الرسمي."
  },
  {
    q: "ما خطوات استلام شقة في العبور الجديدة؟",
    a: "الخطوات العامة: مراجعة العقد والمواصفات، معاينة الوحدة وتسجيل الملاحظات، استلام محضر تسليم موقّع، دفع رسوم المرافق والصيانة، تسجيل العدادات، والاستعلام عن إجراءات التسجيل في الشهر العقاري. التفاصيل تختلف بين مشروع وآخر، لذا راجع العقد واستشر جهاز المدينة للإجراءات الرسمية."
  },
  {
    q: "هل يوجد تمويل عقاري للعبور الجديدة؟",
    a: "تقدم البنوك المصرية برامج تمويل عقاري تخضع لشروطها الخاصة. راجع <a href='/tools/mortgage-affordability/'>حاسبة القدرة الشرائية</a> وقارن الشروط المنشورة في المواقع الرسمية للبنوك. الدليل لا يُرشّد بنكًا محددًا."
  },
  {
    q: "ما أبرز مولات العبور الجديدة؟",
    a: "تتضمن البيانات المنشورة عدة مراكز تجارية ومحاور تجارية داخل المدينة ومحيطها. للتفاصيل راجع <a href='/shopping/'>دليل التسوق والمحلات</a>، مع التأكد من حالة التشغيل الفعلية قبل الزيارة."
  },
];

function main() {
  let html = fs.readFileSync(pagePath, "utf8");

  if (html.includes(MARKER)) {
    console.log("[SKIP] /faq/ already expanded");
    return;
  }

  const newBlock = `${MARKER}\n${NEW_QUESTIONS.map(q => `<details>\n<summary>${q.q}<span>⌄</span></summary><p>${q.a}</p></details>`).join('\n')}`;

  // Insert before </div><div class="related"> or before closing </div></section>
  html = html.replace(
    /<\/div><div class="related">/,
    `${newBlock}\n</div><div class="related">`
  );

  // Update FAQPage schema: extract existing and append new questions
  const faqMatch = html.match(/<script type="application\/ld\+json">(\{"@context":"https:\/\/schema\.org","@type":"FAQPage"[\s\S]*?)<\/script>/);
  if (faqMatch) {
    const faqSchema = JSON.parse(faqMatch[1]);
    faqSchema.mainEntity.push(...NEW_QUESTIONS.map(q => ({
      "@type": "Question",
      name: q.q,
      acceptedAnswer: { "@type": "Answer", text: q.a },
    })));
    html = html.replace(faqMatch[1], JSON.stringify(faqSchema));
  }

  fs.writeFileSync(pagePath, html, "utf8");
  console.log(`[OK] /faq/ expanded with ${NEW_QUESTIONS.length} local questions`);
}

main();
