/**
 * أطلس الواحة الحضرية: تنقل واضح ومسار مرجعي هادئ، يتجنب لغة البيع المباشر.
 */
import { Link, useLocation } from "wouter";
import { Menu, X, MapPinned, ArrowUpLeft, ExternalLink } from "lucide-react";
import { useState } from "react";
import { navItems, references } from "@/lib/guide-data";

const logoUrl = "/manus-storage/new-obour-guide-logo_ec68776f.png";

export function RouteBadge({ children }: { children: React.ReactNode }) {
  return <span className="route-badge"><MapPinned size={15} strokeWidth={2.3} /> {children}</span>;
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F4F1E8] text-[#2A2E2C]" dir="rtl">
      <header className="site-header">
        <div className="container flex items-center justify-between gap-3 py-3.5">
          <Link href="/" className="brand-mark" aria-label="العودة إلى الرئيسية">
            <img src={logoUrl} alt="رمز دليل مدينة العبور الجديدة" className="brand-icon" width="48" height="48" />
            <span><b>دليل مدينة</b><em>العبور الجديدة</em><small>مرجع مدني · 2026</small></span>
          </Link>
          <nav className="hidden xl:flex items-center gap-1" aria-label="التنقل الرئيسي">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={`nav-link ${location === item.href ? "nav-link-active" : ""}`}>{item.label}</Link>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <span className="data-date">محدّث: أغسطس 2026</span>
            <Link href="/developers" className="header-cta">سجل معايير المطورين <ArrowUpLeft size={15} /></Link>
          </div>
          <button className="menu-button xl:hidden" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-label="فتح قائمة التنقل">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {menuOpen && <nav className="mobile-nav xl:hidden" aria-label="التنقل على الهاتف">
          <div className="container flex flex-col py-3">
            {navItems.map((item) => <Link onClick={() => setMenuOpen(false)} key={item.href} href={item.href} className={`mobile-nav-link ${location === item.href ? "mobile-nav-link-active" : ""}`}>{item.label}</Link>)}
          </div>
        </nav>}
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <div className="container grid gap-10 lg:grid-cols-[1.2fr_.8fr_.8fr]">
          <section>
            <div className="flex items-center gap-3 mb-4">
              <img src={logoUrl} alt="رمز دليل مدينة العبور الجديدة" className="h-11 w-11" width="44" height="44" />
              <p className="font-extrabold text-xl">دليل مدينة العبور الجديدة</p>
            </div>
            <p className="footer-disclosure">هذا الدليل والتقييمات والمقارنات مبنية على معايير منشورة قابلة للتحقق، ونرحّب بأي تصحيح موثّق.</p>
          </section>
          <section>
            <p className="footer-title">مسارات الدليل</p>
            <div className="grid gap-2">
              {navItems.slice(1, 6).map((item) => <Link key={item.href} href={item.href} className="footer-link">{item.label}</Link>)}
            </div>
          </section>
          <section>
            <p className="footer-title">مصادر مفتوحة</p>
            <div className="grid gap-2.5">
              {references.slice(0, 3).map((ref) => <a key={ref.href} href={ref.href} target="_blank" rel="noreferrer" className="footer-link external-link">{ref.label}<ExternalLink size={12} /></a>)}
            </div>
          </section>
        </div>
        <div className="container footer-bottom"><span>© 2026 دليل مدينة العبور الجديدة</span><span>مستقل · معلوماتي · قابل للمراجعة</span></div>
      </footer>
    </div>
  );
}
