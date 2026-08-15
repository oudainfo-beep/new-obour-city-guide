/**
 * أطلس الواحة الحضرية: الصفحة الرئيسية تبني قرارًا على طبقات خريطة وبيانات، لا على وعود بيع.
 */
import { Link } from "wouter";
import { ArrowUpLeft, Building2, CircleDollarSign, Map, Route, TrainFront, ShieldCheck, ChevronLeft } from "lucide-react";
import SEO from "@/components/SEO";
import SiteLayout, { RouteBadge } from "@/components/SiteLayout";
import { developers, neighborhoods } from "@/lib/guide-data";

const heroUrl = "/manus-storage/new-obour-hero-atlas_06362579.png";
const mapUrl = "/manus-storage/new-obour-connectivity-map_406e109a.png";
const neighborhoodUrl = "/manus-storage/new-obour-neighborhoods_ebcc4c51.png";

const cards = [
  { href: "/districts", title: "الأحياء والمناطق", copy: "افهم طبيعة كل نطاق قبل أن تقارن بين الأسعار.", icon: Map },
  { href: "/transport", title: "المواصلات والوصول", copy: "محاور المدينة والقطار الكهربائي في مسار واحد واضح.", icon: TrainFront },
  { href: "/prices", title: "أسعار العقارات", copy: "لقطة سعرية مؤرخة تساعدك على بناء مقارنة أولية.", icon: CircleDollarSign },
  { href: "/developers", title: "دليل المطورين", copy: "مقارنة قابلة للفرز على خمسة معايير منشورة.", icon: Building2 },
];

export default function Home() {
  return <SiteLayout>
    <SEO title="دليلك الكامل للمدينة" description="دليل عربي مستقل عن مدينة العبور الجديدة: الأحياء والأسعار والمواصلات والمطورون وخطوات الشراء، مع مصادر ومعايير قابلة للتحقق." schema={{ "@context": "https://schema.org", "@graph": [{ "@type": "WebSite", name: "دليل مدينة العبور الجديدة", inLanguage: "ar-EG", description: "مرجع عربي محايد للسكن والاستثمار في العبور الجديدة." }, { "@type": "Organization", name: "دليل مدينة العبور الجديدة", description: "دليل معلوماتي مستقل عن مدينة العبور الجديدة." }] }} />
    <section className="hero-section">
      <div className="hero-image-wrap"><img src={heroUrl} alt="مشهد جوي تحريري لمدينة جديدة ومسارات اتصال" fetchPriority="high" /></div>
      <div className="hero-overlay" />
      <div className="hero-atlas-layer" aria-hidden="true"><i className="atlas-route atlas-route-one" /><i className="atlas-route atlas-route-two" /><span className="atlas-station station-one">01</span><span className="atlas-station station-two">02</span><span className="atlas-station station-three">03</span><b className="atlas-evidence">لقطة مرجعية · مسار المدينة</b><em className="atlas-coordinates">حالة البيانات: مراجَع · 2026</em></div>
      <div className="container relative z-10 py-16 md:py-24 lg:py-28 xl:py-36">
        <div className="max-w-2xl">
          <RouteBadge>مرجع مدني · تحديث أغسطس 2026</RouteBadge>
          <p className="eyebrow mt-8">اقرأ المدينة قبل أن تشتري فيها</p>
          <h1 className="hero-title">دليلك الكامل لمدينة <span>العبور الجديدة</span></h1>
          <p className="hero-copy">الأحياء، الأسعار، المطورون، وكل ما تحتاج معرفته قبل الشراء — في مسار واحد مبني على بيانات منشورة ومعاينة مطلوبة.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/developers" className="primary-cta">افتح سجل المطورين <ArrowUpLeft size={18} /></Link>
            <Link href="/districts" className="quiet-cta">استكشف الأحياء <ChevronLeft size={18} /></Link>
          </div>
        </div>
      </div>
      <div className="hero-compass" aria-hidden="true"><i /><span>ش</span><span>ج</span><span>ق</span><span>غ</span></div>
    </section>

    <section className="section-shell -mt-1 relative z-20">
      <div className="container">
        <div className="quick-grid">
          {cards.map(({ href, title, copy, icon: Icon }, index) => <Link key={href} href={href} className="quick-card" style={{ transitionDelay: `${index * 45}ms` }}><span className="quick-station">0{index + 1}</span><span className="quick-icon"><Icon size={20} /></span><span><b>{title}</b><small>{copy}</small></span><ArrowUpLeft size={17} className="mr-auto" /></Link>)}
        </div>
      </div>
    </section>

    <section className="section-shell paper-section">
      <div className="container grid items-center gap-10 lg:grid-cols-[.84fr_1.16fr]">
        <div className="relative"><img src={mapUrl} alt="رسم توضيحي لشبكة وصول مدينة العبور الجديدة" loading="lazy" className="atlas-image" /><span className="map-stamp">خريطة إرشادية<br />غير مقياسية</span></div>
        <div>
          <p className="eyebrow">الصورة العامة</p>
          <h2 className="section-title">مدينة تتشكل بين محاور الحركة وفرص التوسع</h2>
          <p className="body-copy">العبور الجديدة مدينة مخططة تتبع هيئة المجتمعات العمرانية الجديدة؛ تذكر بيانات التخطيط المنشورة مساحة إجمالية تقارب 59 ألف فدان وكتلة عمرانية تقارب 22 ألف فدان. الأهمية العملية للأرقام ليست في حجمها وحده، بل في اختلاف مرحلة الخدمات بين الأحياء.[1]</p>
          <div className="metric-row">
            <div><strong>59 ألف</strong><span>فدان تقريبًا · إجمالي المساحة</span></div>
            <div><strong>22 ألف</strong><span>فدان تقريبًا · كتلة عمرانية</span></div>
            <div><strong>2016</strong><span>قرار إنشاء المدينة</span></div>
          </div>
          <Link href="/about" className="text-link">افهم الفرق بين العبور والعبور الجديدة <ArrowUpLeft size={16} /></Link>
        </div>
      </div>
    </section>

    <section className="section-shell green-section">
      <div className="container grid gap-9 lg:grid-cols-[1.15fr_.85fr] items-end">
        <div>
          <p className="eyebrow text-[#A9D6CD]">كيف تقرأ الخريطة؟</p>
          <h2 className="section-title text-white">لا يوجد «حي أفضل» دون معرفة هدفك</h2>
          <p className="body-copy text-[#E7F0E9]">في مدينة تنمو على مراحل، قرار السكن الفوري يختلف عن قرار الشراء المبكر. هذه خريطة اختصار أولية تساعدك على تحديد نوع البحث، ثم تبدأ زيارة الموقع والمستندات.</p>
        </div>
        <Link href="/districts" className="section-arrow-link">عرض خريطة الأحياء <ArrowUpLeft size={19} /></Link>
      </div>
      <div className="container mt-10 neighborhood-strip">
        {neighborhoods.map((n) => <div key={n.title} className="neighborhood-tile"><span>{n.code}</span><div><b>{n.title}</b><small>{n.fit}</small></div></div>)}
      </div>
    </section>

    <section className="section-shell cream-section">
      <div className="container grid gap-10 lg:grid-cols-[.9fr_1.1fr] items-center">
        <div className="image-note"><img src={neighborhoodUrl} alt="شارع سكني هادئ في مدينة جديدة" loading="lazy" /><span>المعاينة الميدانية لا تُستبدل بصورة أو خريطة.</span></div>
        <div>
          <p className="eyebrow">قبل توقيع أي عقد</p>
          <h2 className="section-title">خمسة أسئلة تحمي قرارك</h2>
          <div className="question-list">
            {[["مشروع مُسلّم", "هل يمكن زيارته الآن؟"], ["إدارة واضحة", "من يدير بعد التسليم وبأي خبرة؟"], ["تمويل ظاهر", "كيف يمول التنفيذ؟"], ["عقد مفصل", "هل المواصفات والتكلفة مكتوبة؟"], ["كثافة مدروسة", "ما نسبة البناء والارتفاعات؟"]].map(([title, text], i) => <div key={title}><span>0{i + 1}</span><p><b>{title}</b>{text}</p></div>)}
          </div>
          <Link href="/buying-guide" className="text-link">اقرأ دليل الشراء خطوة بخطوة <ArrowUpLeft size={16} /></Link>
        </div>
      </div>
    </section>

    <section className="section-shell developer-teaser">
      <div className="container grid gap-9 lg:grid-cols-[1fr_.85fr]">
        <div>
          <RouteBadge>تقييم لا ترتيب مفروض</RouteBadge>
          <h2 className="section-title mt-7">دليل المطورين يبدأ بالدليل</h2>
          <p className="body-copy">المقارنة تستخدم خمس زوايا معلنة: التسليم، الإدارة، الملاءة، شفافية التعاقد، والكثافة. الدرجة تتبع الدليل المتاح؛ وإذا ظهرت بيانات أقوى لمطور آخر في معيار ما، تظهر في النتيجة.</p>
          <Link href="/developers" className="primary-cta mt-7 inline-flex">افتح جدول المقارنة <ArrowUpLeft size={18} /></Link>
        </div>
        <div className="score-preview">
          {developers.slice(0, 2).map((dev) => { const score = ((dev.delivered + dev.management + dev.finance + dev.transparency + dev.density) / 5).toFixed(1); return <div key={dev.name} className="score-preview-row"><span>{dev.name}</span><b>{score}<small>/5</small></b></div>; })}
          <p><ShieldCheck size={16} /> الدرجات إرشادية ومقيدة بما هو منشور وقابل للمراجعة.</p>
        </div>
      </div>
    </section>
  </SiteLayout>;
}
