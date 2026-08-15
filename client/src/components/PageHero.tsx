/**
 * أطلس الواحة الحضرية: رأس تحريري يضع السؤال المدني قبل التفاصيل أو الدعوة إلى الشراء.
 */
import { RouteBadge } from "@/components/SiteLayout";

export default function PageHero({ eyebrow, title, description, tag = "مسار الدليل" }: { eyebrow: string; title: string; description: string; tag?: string }) {
  return <section className="page-hero">
    <div className="page-hero-grid" aria-hidden="true" />
    <div className="container relative py-12 md:py-20 lg:py-24">
      <div className="page-hero-layout">
        <aside className="hero-route-rail" aria-label="سجل مراجعة الصفحة">
          <span className="route-index">01</span>
          <div className="route-curve" aria-hidden="true"><i /><b /><em /></div>
          <p>سجل الصفحة</p>
          <strong>مراجَع · أغسطس 2026</strong>
          <small>مصدر مرجعي: بيانات منشورة ومخططات معلنة</small>
        </aside>
        <div>
          <RouteBadge>{tag}</RouteBadge>
          <p className="eyebrow mt-7">{eyebrow}</p>
          <h1 className="page-title">{title}</h1>
          <p className="page-intro">{description}</p>
        </div>
      </div>
    </div>
  </section>;
}
