/* Obour Guide — تحسينات تفاعلية خفيفة (Progressive Enhancement)
   المحتوى يعمل بالكامل بدون هذا الملف؛ هو فقط يضيف الحركة وحالة الهيدر وتثبيت التطبيق. */
(() => {
  const d = document;
  const de = d.documentElement;
  de.classList.add("js");

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = matchMedia("(pointer: coarse)").matches;

  // ظل الهيدر عند التمرير
  const header = d.querySelector(".site-header");
  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // تسجيل Service Worker للتطبيق التقدمي
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }

  // زر تثبيت التطبيق (PWA install prompt)
  const installBtns = d.querySelectorAll(".pwa-install");
  let installPrompt = null;
  if (installBtns.length) {
    const setVisible = (visible) => installBtns.forEach((b) => (b.hidden = !visible));
    addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      installPrompt = e;
      setVisible(true);
    });
    addEventListener("appinstalled", () => {
      installPrompt = null;
      setVisible(false);
    });
    installBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        installPrompt.userChoice.then((choice) => {
          if (choice.outcome === "accepted") setVisible(false);
          installPrompt = null;
        });
      });
    });
  }

  // حركات الظهور عند التمرير + تدرج داخل المجموعات
  const revealEls = d.querySelectorAll("[data-reveal], [data-reveal-group]");
  if (!revealEls.length) return;
  if (reduced || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
  );
  revealEls.forEach((el) => {
    if (el.hasAttribute("data-reveal-group")) {
      [...el.children].forEach((k, i) =>
        k.style.setProperty("--d", `${Math.min(i * 70, 420)}ms`)
      );
    }
    io.observe(el);
  });

  // تأثير مغناطيسي خفيف للأزرار والبطاقات التفاعلية
  if (!reduced && !isTouch) {
    const magneticSelector =
      ".magnetic, .button, .top-cta, .hero-search button, .pwa-install, .quick-card, .hero-chips a, .dir-hub-card, .dir-item";
    const magneticEls = d.querySelectorAll(magneticSelector);
    magneticEls.forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${x * 0.14}px, ${y * 0.14}px) scale(1.03)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "";
      });
    });
  }
})();
