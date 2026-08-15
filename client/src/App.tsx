/**
 * أطلس الواحة الحضرية: مسارات قصيرة وواضحة لدليل عربي قابل للفهرسة والتصفح.
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
const AboutPage = lazy(async () => ({ default: (await import("./pages/GuidePages")).AboutPage }));
const BuyingGuidePage = lazy(async () => ({ default: (await import("./pages/GuidePages")).BuyingGuidePage }));
const DevelopersPage = lazy(async () => ({ default: (await import("./pages/GuidePages")).DevelopersPage }));
const DistrictsPage = lazy(async () => ({ default: (await import("./pages/GuidePages")).DistrictsPage }));
const FAQPage = lazy(async () => ({ default: (await import("./pages/GuidePages")).FAQPage }));
const PricesPage = lazy(async () => ({ default: (await import("./pages/GuidePages")).PricesPage }));
const TransportPage = lazy(async () => ({ default: (await import("./pages/GuidePages")).TransportPage }));

function Router() {
  return <Suspense fallback={<main className="min-h-screen bg-[#F4F1E8]" aria-busy="true" />}><Switch><Route path="/" component={Home} /><Route path="/about" component={AboutPage} /><Route path="/districts" component={DistrictsPage} /><Route path="/transport" component={TransportPage} /><Route path="/prices" component={PricesPage} /><Route path="/developers" component={DevelopersPage} /><Route path="/buying-guide" component={BuyingGuidePage} /><Route path="/faq" component={FAQPage} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch></Suspense>;
}
export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>; }
