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
    const STORAGE_KEY = "obour-pwa-dismissed";
    const isDismissed = () => {
      try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; }
    };
    const markDismissed = () => {
      try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    };

    // تأكد إن الأزرار ظاهرة حتى لو كان HTML القديم مخزّن بـ hidden
    installBtns.forEach((b) => b.removeAttribute("hidden"));

    const setReady = (ready) => installBtns.forEach((b) => b.classList.toggle("is-ready", ready));

    function createBanner() {
      if (d.getElementById("pwa-banner") || isDismissed()) return;
      const banner = d.createElement("aside");
      banner.id = "pwa-banner";
      banner.className = "pwa-banner";
      banner.setAttribute("role", "status");
      banner.setAttribute("aria-live", "polite");
      banner.innerHTML = `
        <div class="pwa-banner__body">
          <span class="pwa-banner__icon" aria-hidden="true">📲</span>
          <p><strong>ثبّت دليل العبور</strong> للوصول السريع حتى بدون إنترنت.</p>
          <button class="pwa-banner__install" type="button">تثبيت</button>
          <button class="pwa-banner__close" type="button" aria-label="إغلاق">✕</button>
        </div>
      `;
      d.body.appendChild(banner);

      const install = banner.querySelector(".pwa-banner__install");
      const close = banner.querySelector(".pwa-banner__close");

      install.addEventListener("click", () => {
        if (installPrompt) {
          installPrompt.prompt();
          installPrompt.userChoice.then((choice) => {
            if (choice.outcome === "accepted") {
              banner.remove();
              installBtns.forEach((b) => b.setAttribute("hidden", ""));
            }
            installPrompt = null;
            setReady(false);
          });
        } else {
          banner.remove();
          alert("لتثبيت دليل العبور:\n• Chrome / Edge / Android: استخدم خيار 'تثبيت' في شريط العنوان أو القائمة.\n• iPhone / Safari: اضغط زر المشاركة ثم 'Add to Home Screen'.");
        }
      });

      close.addEventListener("click", () => {
        markDismissed();
        banner.remove();
      });

      // يختفي تلقائيًا بعد 12 ثانية إذا لم يتفاعل المستخدم
      setTimeout(() => {
        if (banner.isConnected) {
          banner.classList.add("pwa-banner--fading");
          setTimeout(() => banner.remove(), 400);
        }
      }, 12000);
    }

    addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      installPrompt = e;
      setReady(true);
      createBanner();
    });

    addEventListener("appinstalled", () => {
      installPrompt = null;
      installBtns.forEach((b) => {
        b.classList.remove("is-ready");
        b.textContent = "تم التثبيت";
        b.disabled = true;
      });
      const banner = d.getElementById("pwa-banner");
      if (banner) banner.remove();
      markDismissed();
    });

    installBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (installPrompt) {
          installPrompt.prompt();
          installPrompt.userChoice.then((choice) => {
            if (choice.outcome === "accepted") {
              installBtns.forEach((b) => b.setAttribute("hidden", ""));
            }
            installPrompt = null;
            setReady(false);
          });
        } else {
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
      ".magnetic, .button, .top-cta, .hero-search button, .pwa-install, .hero-chips a";
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

  // Cursor spotlight — تتبع المؤشر داخل البطاقات
  if (!reduced && !isTouch) {
    const spotlightSelector = ".quick-card, .criteria div, .buy-grid article, .emergency-card, .dir-item, .dir-hub-card, .action-card, .score-card";
    const spotlightEls = d.querySelectorAll(spotlightSelector);
    spotlightEls.forEach((el) => {
      el.classList.add("spotlight");
      el.addEventListener("mousemove", (e) => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty("--x", `${e.clientX - rect.left}px`);
        el.style.setProperty("--y", `${e.clientY - rect.top}px`);
      });
    });
  }

  // تأثير tilt خفيف للبطاقات
  if (!reduced && !isTouch) {
    const tiltSelector = ".quick-card, .dir-hub-card, .buy-grid article";
    const tiltEls = d.querySelectorAll(tiltSelector);
    tiltEls.forEach((el) => {
      el.classList.add("tilt");
      el.addEventListener("mousemove", (e) => {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-6px) scale(1.01)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "";
      });
    });
  }

  // Parallax خفيف للصور أثناء التمرير
  if (!reduced && !isTouch) {
    const parallaxImgs = d.querySelectorAll(".split-image img, .home-hero > img");
    parallaxImgs.forEach((img) => img.classList.add("parallax-img"));
    let ticking = false;
    addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        parallaxImgs.forEach((img) => {
          const rect = img.getBoundingClientRect();
          const vh = window.innerHeight;
          const progress = (rect.top + rect.height / 2) / vh - 0.5;
          img.style.transform = `translateY(${progress * 18}px) scale(1.04)`;
        });
        ticking = false;
      });
    }, { passive: true });
  }

  // Animated text — تدرج على العناوين داخل الأقسام الداكنة فقط
  if (!reduced) {
    const gradientTargets = d.querySelectorAll(".green h2, .green h3, .olive h2, .olive h3, .district-grid article > b");
    gradientTargets.forEach((el) => el.classList.add("gradient-text"));
  }
})();
