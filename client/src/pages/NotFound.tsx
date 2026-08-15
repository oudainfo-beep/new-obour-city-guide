/** أطلس الواحة الحضرية: مخرج واضح يعيد القارئ إلى مسارات الدليل. */
import { Link } from "wouter";
import SiteLayout from "@/components/SiteLayout";
import SEO from "@/components/SEO";
export default function NotFound() { return <SiteLayout><SEO title="الصفحة غير موجودة" description="الصفحة المطلوبة غير موجودة في دليل مدينة العبور الجديدة." /><section className="section-shell paper-section min-h-[55vh] flex items-center"><div className="container"><p className="eyebrow">خطأ 404</p><h1 className="page-title">لم نجد هذا المسار</h1><p className="page-intro">ربما تغير الرابط، أو يمكنك الرجوع إلى خريطة الدليل والبدء من جديد.</p><Link href="/" className="primary-cta inline-flex mt-7">العودة للرئيسية</Link></div></section></SiteLayout>; }
