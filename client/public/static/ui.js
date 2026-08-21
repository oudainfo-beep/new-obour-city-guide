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

  // شريط تقدّم التمرير
  const progressBar = d.createElement("div");
  progressBar.className = "scroll-progress";
  progressBar.setAttribute("aria-hidden", "true");
  d.body.appendChild(progressBar);
  const updateProgress = () => {
    const doc = d.documentElement;
    const scroll = window.scrollY || doc.scrollTop || d.body.scrollTop || 0;
    const max = doc.scrollHeight - doc.clientHeight;
    const pct = max > 0 ? Math.min(1, Math.max(0, scroll / max)) : 0;
    progressBar.style.transform = `scaleX(${pct})`;
  };
  addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  // عدّادات متحركة للأرقام في الرئيسية
  const countUp = (el, target, suffix = "", duration = 1400) => {
    const start = performance.now();
    const startVal = 0;
    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const val = startVal + (target - startVal) * easeOutQuart(p);
      const isInt = Number.isInteger(target);
      el.textContent = (isInt ? Math.round(val) : val.toFixed(1)) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else {
        el.textContent = target + suffix;
        el.style.animation = "count-pop .35s var(--ease-bounce)";
      }
    };
    requestAnimationFrame(step);
  };
  const parseMetric = (text) => {
    const m = text.trim().match(/^([0-9\.]+)(.*)$/);
    if (!m) return null;
    const n = parseFloat(m[1]);
    return Number.isFinite(n) ? { n, suffix: m[2] } : null;
  };
  const counterEls = d.querySelectorAll(".metrics b, .neighborhood-strip b, .score-card div b");
  if (counterEls.length && !reduced && "IntersectionObserver" in window) {
    const counterIo = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          const el = e.target;
          const original = el.textContent;
          const parsed = parseMetric(original);
          if (parsed) {
            el.textContent = "0" + parsed.suffix;
            countUp(el, parsed.n, parsed.suffix);
          }
          counterIo.unobserve(el);
        }
      }
    }, { threshold: 0.4 });
    counterEls.forEach((el) => counterIo.observe(el));
  }

  // اقتراحات البحث في الهيدر
  function initSearchSuggest() {
    if (location.pathname === "/search/") return;
    const inputs = d.querySelectorAll(".site-search input[name='q'], .m-search input[name='q']");
    if (!inputs.length) return;

    const norm = (t) =>
      String(t || "")
        .toLowerCase()
        .replace(/[ً-ْـ]/g, "")
        .replace(/[أإآٱ]/g, "ا")
        .replace(/ى/g, "ي")
        .replace(/ة/g, "ه")
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim();

    let idx = null;
    fetch("/search-index.json")
      .then((r) => r.json())
      .then((data) => {
        idx = data.map((it) => ({ ...it, _s: norm([it.n, it.a, it.t, it.d, it.k].filter(Boolean).join(" ")) }));
      })
      .catch(() => {});

    function renderBox(input, list, query) {
      let box = input.parentElement.querySelector(".search-suggest");
      if (!box) {
        box = d.createElement("div");
        box.className = "search-suggest";
        box.setAttribute("role", "listbox");
        input.parentElement.style.position = "relative";
        input.parentElement.appendChild(box);
      }
      box.innerHTML = "";
      if (!list.length) {
        box.classList.remove("is-open");
        return box;
      }
      list.forEach((it, i) => {
        const a = d.createElement("a");
        a.href = it.u;
        a.setAttribute("role", "option");
        a.setAttribute("data-index", i);
        a.innerHTML = `<strong>${it.n}</strong><small>${[it.k, it.a].filter(Boolean).join(" · ")}</small>`;
        a.addEventListener("click", () => { box.classList.remove("is-open"); });
        box.appendChild(a);
      });
      box.classList.add("is-open");
      return box;
    }

    function move(input, delta) {
      const box = input.parentElement.querySelector(".search-suggest");
      if (!box || !box.classList.contains("is-open")) return;
      const items = [...box.querySelectorAll("a")];
      const active = box.querySelector("a.is-selected");
      let pos = active ? items.indexOf(active) : -1;
      pos = Math.max(0, Math.min(items.length - 1, pos + delta));
      items.forEach((el) => el.classList.remove("is-selected"));
      items[pos].classList.add("is-selected");
      items[pos].scrollIntoView({ block: "nearest" });
    }

    function search(query, input) {
      if (!idx || !query) return;
      const qWords = norm(query).split(" ").filter(Boolean);
      if (!qWords.length) { renderBox(input, []); return; }
      const hits = [];
      for (const it of idx) {
        let score = 0, ok = true;
        for (const w of qWords) {
          const pos = it._s.indexOf(w);
          if (pos < 0) { ok = false; break; }
          score += pos === 0 ? 3 : 1;
        }
        if (ok) {
          if (norm(it.n).indexOf(qWords[0]) === 0) score += 4;
          hits.push({ score, item: it });
        }
      }
      hits.sort((a, b) => b.score - a.score);
      renderBox(input, hits.slice(0, 7).map((h) => h.item), query);
    }

    inputs.forEach((input) => {
      let timer = null;
      input.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(() => search(input.value, input), 180);
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown") { e.preventDefault(); move(input, 1); }
        else if (e.key === "ArrowUp") { e.preventDefault(); move(input, -1); }
        else if (e.key === "Escape") {
          const box = input.parentElement.querySelector(".search-suggest");
          if (box) box.classList.remove("is-open");
        }
        else if (e.key === "Enter") {
          const box = input.parentElement.querySelector(".search-suggest");
          const active = box && box.querySelector("a.is-selected");
          if (active) {
            e.preventDefault();
            location.href = active.href;
          }
        }
      });
      input.addEventListener("focus", () => { if (input.value.trim()) search(input.value, input); });
    });

    d.addEventListener("click", (e) => {
      if (e.target.closest(".site-search, .m-search")) return;
      d.querySelectorAll(".search-suggest").forEach((b) => b.classList.remove("is-open"));
    });
  }
  initSearchSuggest();

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
