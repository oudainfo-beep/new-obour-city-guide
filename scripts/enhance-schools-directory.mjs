import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generatorPath = path.join(root, "scripts", "render-static.mjs");
let source = fs.readFileSync(generatorPath, "utf8");

if (source.includes("const realSchools = [")) {
  throw new Error("The verified schools directory is already present in the generator.");
}

const directoryData = String.raw`
const realSchools = [
  { group: "داخل العبور الجديدة", name: "مجمع الشيماء التعليمي", area: "حي المجد · العبور 2 · قطعة 37", type: "حكومي · رياض أطفال وابتدائي وإعدادي", sourceLabel: "دليل مدارس العبور الجديدة", source: "https://www.newobour.city/schools-directory.php", maps: "مجمع الشيماء التعليمي حي المجد العبور الجديدة" },
  { group: "داخل العبور الجديدة", name: "بلال بن رباح الثانوية المشتركة", area: "حي المجد · قطعة 60", type: "حكومي · ثانوي · مختلط", sourceLabel: "دليل مدارس العبور الجديدة", source: "https://www.newobour.city/schools-directory.php", maps: "بلال بن رباح الثانوية المشتركة حي المجد العبور الجديدة" },
  { group: "داخل العبور الجديدة", name: "مجمع الجمهورية الجديدة للتعليم الأساسي", area: "حي الحرية · العبور الجديدة", type: "حكومي · رياض أطفال وابتدائي وإعدادي", sourceLabel: "دليل مدارس العبور الجديدة", source: "https://www.newobour.city/schools-directory.php", maps: "الجمهورية الجديدة للتعليم الأساسي حي الحرية العبور الجديدة" },
  { group: "داخل العبور الجديدة", name: "مجمع الحرية التعليمي", area: "حي الحرية · العبور الجديدة", type: "حكومي · رياض أطفال وابتدائي وإعدادي", sourceLabel: "دليل مدارس العبور الجديدة", source: "https://www.newobour.city/schools-directory.php", maps: "مدرسة الحرية حي الحرية العبور الجديدة" },
  { group: "داخل العبور الجديدة", name: "مجمع أسامة بن زيد التعليمي", area: "حي الكرامة · الإسكان الاجتماعي", type: "حكومي · رياض أطفال وابتدائي وإعدادي", sourceLabel: "دليل مدارس العبور الجديدة", source: "https://www.newobour.city/schools-directory.php", maps: "أسامة بن زيد للتعليم الأساسي حي الكرامة العبور الجديدة" },
  { group: "داخل العبور الجديدة", name: "مدارس الكرامة الرسمية للغات", area: "حي الكرامة · العبور الجديدة", type: "رسمية لغات · إعدادي وثانوي", sourceLabel: "دليل مدارس العبور الجديدة", source: "https://www.newobour.city/schools-directory.php", maps: "مدرسة الكرامة الرسمية لغات العبور الجديدة" },
  { group: "مدينة العبور القائمة — قريبة من العبور الجديدة", name: "مدارس النيل المصرية الدولية — فرع العبور", area: "مدينة العبور القائمة · الفرع مدرج رسميًا ضمن شبكة مدارس النيل", type: "مدارس نيل مصرية دولية", sourceLabel: "الموقع الرسمي لمدارس النيل", source: "https://nes.moe.gov.eg/branches.html?id=1", maps: "Nile Egyptian International Schools Obour" },
  { group: "مدينة العبور القائمة — قريبة من العبور الجديدة", name: "المدرسة الرسمية الدولية بالعبور (IPS)", area: "الحي الثالث · قطعة 2 · بلوك 28044 · قرب سور نادي الأطباء", type: "مدرسة رسمية دولية", sourceLabel: "Foundation of International Schools in Egypt", source: "https://fise-eg.org/ips/", maps: "International Public School El Obour IPS" },
  { group: "مدينة العبور القائمة — قريبة من العبور الجديدة", name: "المدرسة الرسمية الدولية روضة العبور (IPS)", area: "مدينة العبور القائمة · فرع روضة العبور", type: "مدرسة رسمية دولية", sourceLabel: "بوابة المدارس الرسمية الدولية", source: "https://www.ips-schools.com/", maps: "International Public School Rawdat El Obour" },
  { group: "مدينة العبور القائمة — قريبة من العبور الجديدة", name: "المدرسة المصرية اليابانية بالعبور (EJS)", area: "الحي السابع · بعد كارفور العبور", type: "مدرسة حكومية ضمن شبكة المدارس المصرية اليابانية", sourceLabel: "دليل مدارس مصر + بوابة EJS", source: "https://masrschools.com/ejs/", maps: "Egyptian Japanese School Obour City" },
];
`;

source = source.replace("const health = [", `${directoryData}\nconst health = [`);

const schoolsPage = String.raw`const schoolsPage = 
`;
const schoolsBody = String.raw`const schoolsPage = \

\`<main>\${pageHero({tag:"المدارس والتعليم", eyebrow:"دليل فعلي للأسر", title:"مدارس العبور الجديدة: كيف تختار قبل أن تختار الوحدة", description:"أسماء مدارس فعلية داخل العبور الجديدة وحولها، مع المنطقة ونوع التعليم ومصدر يمكن مراجعته قبل الزيارة."})}\${atlasBody("خريطة المدارس", "افصل بين المدارس داخل العبور الجديدة والمدارس الموجودة في مدينة العبور القائمة، ثم قِس الرحلة في وقت الطابور.")}<section class="paper section"><div class="wrap"><p class="eyebrow">أين توجد المدارس فعلًا؟</p><h2>دليل مدارس منشور: داخل العبور الجديدة وحولها</h2><p class="wide-copy">هذه ليست قائمة توصيات أو ترتيبًا لأفضل مدرسة. إنها نقاط بداية بأسماء فعلية ومناطق منشورة ومصدر ظاهر. يضم دليل العبور الجديدة المحلي مدارس حكومية ورسمية موزعة على أحياء المجد والحرية والكرامة، بينما توجد مدارس إضافية في مدينة العبور القائمة القريبة. يجب تأكيد المقاعد والرسوم والمراحل المتاحة مباشرةً من المدرسة قبل التقديم.</p><div class="school-directory">\${["داخل العبور الجديدة", "مدينة العبور القائمة — قريبة من العبور الجديدة"].map((group) => \
  \`<section class="school-group"><div class="school-group-head"><span>⌖</span><div><p>\${group}</p><h3>\${group === "داخل العبور الجديدة" ? "مدارس تقع ضمن نطاق المدينة الجديد" : "خيارات تستلزم قياس رحلة المدرسة اليومية"}</h3></div></div><div class="school-grid">\${realSchools.filter((school) => school.group === group).map((school, index) => \
    \`<article class="school-card"><div class="school-card-no">\${String(index + 1).padStart(2, "0")}</div><h4>\${school.name}</h4><p class="school-area">⌖ \${school.area}</p><p class="school-type">\${school.type}</p><div class="school-actions"><a href="\${school.source}" target="_blank" rel="noopener noreferrer">المصدر ↗</a><a href="https://www.google.com/maps/search/?api=1&query=\${encodeURIComponent(school.maps)}" target="_blank" rel="noopener noreferrer">افتح الخريطة ↗</a></div><small>التحقق: \${school.sourceLabel}</small></article>\`).join("")}</div></section>\`).join("")}</div></div></section><section class="cream section"><div class="wrap content-grid"><article><h2>كيف تستخدم الدليل دون الوقوع في خطأ الموقع؟</h2><p>الاسم وحده لا يكفي. بعض المدارس تقع داخل العبور الجديدة نفسها، وبعضها في مدينة العبور القائمة غرب النطاق. لذلك عند اختيار وحدة، ابدأ بثلاثة أسماء محتملة من القائمة، وافتح الخريطة لكل اسم، ثم قِس الرحلة من باب المشروع إلى بوابة المدرسة في ساعة الذهاب الصباحي وساعة العودة. لا تعتمد على وصف «قريب من المدارس» من دون تحديد المدرسة المقصودة ومسارها الفعلي.</p><p>تظهر القائمة أيضًا أن نوع المدرسة لا يجيب عن كل الأسئلة. قبل التسجيل، تأكد من المرحلة التي تقبلها المدرسة في السنة المطلوبة، نظام المنهج، المقاعد المتاحة، الرسوم الكاملة، ورسوم الباص إن كنت ستستخدمه. الصفحات الرسمية قد تتغير مع موسم التقديم، لذلك استخدم الرابط والموقع كأداة تحقق، لا كضمان قبول أو تسعير ثابت.</p><h2>أسئلة تُطرح على أي مدرسة قبل التسجيل</h2><ul class="check-list"><li>✓ ما إجمالي الرسوم السنوية شاملة الأنشطة والزي والكتب والباص؟</li><li>✓ ما سياسة الزيادة السنوية، وهل هي مكتوبة في العقد؟</li><li>✓ كم عدد الطلاب في الفصل الواحد فعليًا هذا العام؟</li><li>✓ ما نسبة استمرار المعلمين من العام الماضي؟</li><li>✓ هل يمكن زيارة المدرسة في يوم دراسي عادي وليس في يوم مفتوح؟</li></ul><p>الزيارة في يوم دراسي عادي تكشف ما لا يظهر في اليوم المفتوح: حركة الطلاب، نظافة المرافق، طريقة تعامل الإدارة، وحالة الفناء والملاعب. إن رفضت المدرسة الزيارة العادية، فهذه إشارة تستحق التوقف. ولأن العبور الجديدة مدينة ممتدة، راقب وقت الباص أيضًا؛ طريق طويل قد يضيف ساعة قبل بداية اليوم الدراسي.</p></article><aside class="action-card"><p>رتّب قرار العائلة</p><a class="button" href="/districts/">قارن الأحياء ↖</a><a class="text-link" href="/transport/">احسب زمن الرحلة ↖</a><a class="text-link" href="/services/">راجع الخدمات الأخرى ↖</a></aside></div></section><section class="section"><div class="wrap"><h2>مصادر الدليل التعليمي</h2><div class="data-table"><div><b>المصدر</b><b>ماذا راجعنا؟</b></div><div><span><a href="https://www.newobour.city/schools-directory.php" target="_blank" rel="noopener noreferrer">دليل مدارس العبور الجديدة ↗</a></span><span>الاسم، الحي، المرحلة، والنوع في نطاق العبور الجديدة.</span></div><div><span><a href="https://nes.moe.gov.eg/" target="_blank" rel="noopener noreferrer">مدارس النيل المصرية الدولية ↗</a></span><span>تأكيد إدراج فرع مدينة العبور في الشبكة الرسمية.</span></div><div><span><a href="https://www.ips-schools.com/" target="_blank" rel="noopener noreferrer">المدارس الرسمية الدولية ↗</a></span><span>تأكيد إدراج فرعي IPS العبور وروضة العبور.</span></div><div><span><a href="https://ejs4students.moe.gov.eg/" target="_blank" rel="noopener noreferrer">بوابة المدارس المصرية اليابانية ↗</a></span><span>الرجوع إلى بوابة القبول الرسمية عند فتح التقديم.</span></div></div><p class="caption">آخر مراجعة للدليل: أغسطس 2026. إذا وجدت بيانات تغيرت، استخدم رابط المصدر للتحقق المباشر قبل اتخاذ قرار السكن أو التسجيل.</p></div></section>\${refsHtml()}</main>\`;
`;

source = source.replace(/const schoolsPage = `[\s\S]*?`;/, schoolsBody.trim());
source = source.replace(
  'schools.map((x,i)=>({"@type":"ListItem",position:i+1,name:x[0],description:x[1]}))',
  'realSchools.map((school,i)=>({"@type":"ListItem",position:i+1,name:school.name,description:`${school.area} · ${school.type}`}))',
);
source = source.replace(
  '<link rel="stylesheet" href="/static/site.css">',
  '<link rel="stylesheet" href="/static/site.css"><link rel="stylesheet" href="/static/schools-directory.css">',
);

if (!source.includes("const realSchools = [") || !source.includes("مدارس العبور الجديدة: كيف تختار قبل أن تختار الوحدة")) {
  throw new Error("Schools-directory replacement did not complete.");
}

fs.writeFileSync(generatorPath, source);
console.log("Added verified schools directory data and updated the schools-page template.");
