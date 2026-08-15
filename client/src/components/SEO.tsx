/**
 * أطلس الواحة الحضرية: طبقة SEO صريحة لتغيير العنوان والوصف وبيانات JSON-LD لكل مسار.
 */
import { useEffect } from "react";

type SEOProps = {
  title: string;
  description: string;
  schema?: Record<string, unknown> | Record<string, unknown>[];
};

export default function SEO({ title, description, schema }: SEOProps) {
  useEffect(() => {
    document.title = `${title} | دليل مدينة العبور الجديدة`;
    document.documentElement.lang = "ar";
    document.documentElement.dir = "rtl";

    const setMeta = (selector: string, attribute: "name" | "property", content: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attribute, selector.includes("og:") ? selector.replace('[property="', "").replace('"]', "") : selector.replace('[name="', "").replace('"]', ""));
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMeta('meta[name="description"]', "name", description);
    setMeta('meta[property="og:title"]', "property", title);
    setMeta('meta[property="og:description"]', "property", description);
    setMeta('meta[property="og:url"]', "property", window.location.href);
    return () => undefined;
  }, [title, description]);

  return schema ? <script type="application/ld+json">{JSON.stringify(schema)}</script> : null;
}
