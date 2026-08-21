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
    const setReady = (ready) => installBtns.forEach((b) => b.classList.toggle("is-ready", ready));
    addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      installPrompt = e;
      setReady(true);
    });
    addEventListener("appinstalled", () => {
      installPrompt = null;
      installBtns.forEach((b) => {
        b.classList.remove("is-ready");
        b.textContent = "تم التثبيت";
        b.disabled = true;
      });
    });
    installBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (installPrompt) {
          installPrompt.prompt();
          installPrompt.userChoice.then((choice) => {
            if (choice.outcome === "accepted") {
              installBtns.forEach((b) => (b.hidden = true));
            }
            installPrompt = null;
            setReady(false);
          });
        } else {
          // المتصفح لم يُطلق الحدث بعد أو لا يدعم التثبيت المباشر
          alert("لتثبيت دليل العبور:\n• Chrome / Edge / Android: استخدم خيار 'تثبيت' في شريط العنوان أو القائمة.\n• iPhone / Safari: اضغط زر المشاركة ثم 'Add to Home Screen'.");
        }
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
