/* ==========================================================================
   Obour Guide — حزمة تحسينات تجربة الاستخدام (UX Pack) — 2026-08
   ملف مستقل يُحقن عبر scripts/seo-phase34-ux-pack.mjs — لا يعتمد على ui.js.
   يضيف: رابط تخطٍّ، زر عودة للأعلى، فهرس محتويات لاصق مع scrollspy،
   فلترة فورية لقوائم الدليل والجداول، تلميح تمرير الجداول،
   وإغلاقًا محسّنًا لقائمة الموبايل. تحسين تدريجي بالكامل.
   ========================================================================== */
(() => {
  if (window.__uxPackLoaded) return;
  window.__uxPackLoaded = true;

  const d = document;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const isEn = (d.documentElement.lang || "ar").toLowerCase().startsWith("en");
  const uxT = {
    skip: isEn ? "Skip to content" : "تخطَّ إلى المحتوى",
    toTop: isEn ? "Back to top" : "العودة إلى أعلى الصفحة",
    toc: isEn ? "On this page" : "في هذه الصفحة",
    tocAria: isEn ? "Page contents" : "محتويات هذه الصفحة",
    dirFilter: isEn ? "Filter by name, address, or district…" : "فلترة فورية بالاسم أو العنوان أو الحي…",
    tableFilter: isEn ? "Filter table rows…" : "فلترة صفوف الجدول…",
    clear: isEn ? "Clear filter" : "مسح الفلتر",
    noDir: isEn ? "No matching results — try a simpler keyword." : "لا توجد نتائج مطابقة — جرّب كلمة أبسط أو بدون تشكيل.",
    noRows: isEn ? "No matching rows in this table." : "لا توجد صفوف مطابقة في الجدول.",
    results: (n) => (isEn ? `${n} result${n === 1 ? "" : "s"}` : `${n} نتيجة`),
    rows: (n) => (isEn ? `${n} row${n === 1 ? "" : "s"}` : `${n} صف`),
    scrollHint: isEn ? "Scroll to see more columns" : "مرّر لعرض بقية الأعمدة",
  };

  const normUx = (t) =>
    String(t || "")
      .toLowerCase()
      .replace(/[ً-ْـ]/g, "")
      .replace(/[أإآٱ]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim();

  // 1) رابط التخطي إلى المحتوى الرئيسي
  (() => {
    const main = d.querySelector("main");
    if (!main || d.querySelector(".skip-link")) return;
    if (!main.id) main.id = "main-content";
    main.setAttribute("tabindex", "-1");
    const a = d.createElement("a");
    a.className = "skip-link";
    a.href = "#" + main.id;
    a.textContent = uxT.skip;
    d.body.prepend(a);
  })();

  // 2) زر العودة إلى الأعلى
  (() => {
    if (d.querySelector(".to-top")) return;
    const btn = d.createElement("button");
    btn.type = "button";
    btn.className = "to-top";
    btn.setAttribute("aria-label", uxT.toTop);
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>';
    d.body.appendChild(btn);
    const onScroll = () => btn.classList.toggle("is-visible", window.scrollY > 640);
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
      btn.blur();
    });
  })();

  // 3) فهرس محتويات الصفحة — يُبنى من عناوين h2 داخل المحتوى
  (() => {
    if (location.pathname === "/" || location.pathname === "/index.html") return;
    const main = d.querySelector("main");
    if (!main) return;
    const heads = [...main.querySelectorAll("h2")].filter(
      (h) => h.textContent.trim().length > 2 && !h.closest(".site-footer")
    );
    if (heads.length < 3) return;
    // لا فائدة من الفهرس في الصفحات القصيرة
    if (d.documentElement.scrollHeight < window.innerHeight * 2.2) return;

    heads.forEach((h, i) => {
      if (!h.id) h.id = "sec-" + (i + 1);
      h.style.scrollMarginTop = "150px";
    });

    const nav = d.createElement("nav");
    nav.className = "page-toc";
    nav.setAttribute("aria-label", uxT.tocAria);
    const row = d.createElement("div");
    row.className = "page-toc__row wrap";
    const label = d.createElement("span");
    label.className = "page-toc__label";
    label.textContent = uxT.toc;
    row.appendChild(label);
    const links = heads.map((h) => {
      const a = d.createElement("a");
      a.href = "#" + h.id;
      a.textContent = h.textContent.trim().replace(/\s+/g, " ").slice(0, 42);
      a.addEventListener("click", (e) => {
        e.preventDefault();
        h.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
        history.replaceState(null, "", "#" + h.id);
      });
      row.appendChild(a);
      return a;
    });
    nav.appendChild(row);

    // موضع الإدراج: بعد هيرو الصفحة، وإلا أول main
    const hero = main.querySelector(":scope > .page-hero, :scope > .home-hero");
    if (hero && hero.nextSibling) main.insertBefore(nav, hero.nextSibling);
    else if (hero) main.appendChild(nav);
    else main.prepend(nav);

    // Scrollspy — تمييز القسم الظاهر
    if ("IntersectionObserver" in window) {
      let active = null;
      const setActive = (i) => {
        if (active === i) return;
        active = i;
        links.forEach((a, j) => {
          if (j === i) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
        });
        if (i != null && links[i]) {
          links[i].scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduced ? "auto" : "smooth" });
        }
      };
      const spy = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) setActive(heads.indexOf(e.target));
          }
        },
        { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
      );
      heads.forEach((h) => spy.observe(h));
    }
  })();

  // 4) فلترة فورية لبطاقات الدليل (dir-item) ومجموعاتها (dir-group)
  (() => {
    const items = [...d.querySelectorAll(".dir-list .dir-item")];
    if (items.length < 4) return;

    const box = d.createElement("div");
    box.className = "ux-filter";
    box.setAttribute("role", "search");
    box.innerHTML = `
      <span class="ux-filter__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
      </span>
      <input type="search" placeholder="${uxT.dirFilter}" aria-label="${uxT.dirFilter}">
      <button class="ux-filter__clear" type="button" aria-label="${uxT.clear}" hidden>✕</button>
      <span class="ux-filter__count" aria-live="polite"></span>`;
    const anchor = d.querySelector(".dir-group") || d.querySelector(".dir-list");
    anchor.parentElement.insertBefore(box, anchor);
    const empty = d.createElement("p");
    empty.className = "ux-filter-empty";
    empty.textContent = uxT.noDir;
    box.after(empty);

    const input = box.querySelector("input");
    const clearBtn = box.querySelector(".ux-filter__clear");
    const count = box.querySelector(".ux-filter__count");
    const itemsNorm = items.map((el) => normUx(el.textContent));
    const groups = [...d.querySelectorAll(".dir-group")];

    const apply = () => {
      const q = normUx(input.value);
      const words = q.split(" ").filter(Boolean);
      let shown = 0;
      items.forEach((el, i) => {
        const hit = !words.length || words.every((w) => itemsNorm[i].includes(w));
        el.classList.toggle("ux-hidden", !hit);
        if (hit) shown++;
      });
      // إخفاء المجموعات الفارغة وإظهار غيرها
      groups.forEach((g) => {
        const anyVisible = [...g.querySelectorAll(".dir-item")].some((el) => !el.classList.contains("ux-hidden"));
        g.classList.toggle("ux-hidden", !anyVisible);
      });
      clearBtn.hidden = !input.value;
      count.textContent = words.length ? uxT.results(shown) : "";
      empty.classList.toggle("is-visible", words.length > 0 && shown === 0);
      d.body.classList.toggle("ux-filtering", words.length > 0);
    };
    let t = null;
    input.addEventListener("input", () => { clearTimeout(t); t = setTimeout(apply, 120); });
    input.addEventListener("keydown", (e) => { if (e.key === "Escape") { input.value = ""; apply(); } });
    clearBtn.addEventListener("click", () => { input.value = ""; apply(); input.focus(); });
  })();

  // 5) فلترة فورية للجداول الطويلة + تلميح التمرير الأفقي
  (() => {
    // الجداول العادية داخل table-wrap
    d.querySelectorAll(".table-wrap table").forEach((table) => {
      const rows = [...table.querySelectorAll("tbody tr")];
      const wrap = table.closest(".table-wrap");
      if (rows.length >= 8 && !wrap.dataset.uxFilter) {
        wrap.dataset.uxFilter = "1";
        const box = d.createElement("div");
        box.className = "ux-filter";
        box.setAttribute("role", "search");
        box.innerHTML = `
          <span class="ux-filter__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
          </span>
          <input type="search" placeholder="${uxT.tableFilter}" aria-label="${uxT.tableFilter}">
          <button class="ux-filter__clear" type="button" aria-label="${uxT.clear}" hidden>✕</button>
          <span class="ux-filter__count" aria-live="polite"></span>`;
        wrap.parentElement.insertBefore(box, wrap);
        const empty = d.createElement("p");
        empty.className = "ux-filter-empty";
        empty.textContent = uxT.noRows;
        wrap.after(empty);

        const input = box.querySelector("input");
        const clearBtn = box.querySelector(".ux-filter__clear");
        const count = box.querySelector(".ux-filter__count");
        const rowsNorm = rows.map((tr) => normUx(tr.textContent));
        const apply = () => {
          const words = normUx(input.value).split(" ").filter(Boolean);
          let shown = 0;
          rows.forEach((tr, i) => {
            const hit = !words.length || words.every((w) => rowsNorm[i].includes(w));
            tr.classList.toggle("ux-hidden", !hit);
            if (hit) shown++;
          });
          clearBtn.hidden = !input.value;
          count.textContent = words.length ? uxT.rows(shown) : "";
          empty.classList.toggle("is-visible", words.length > 0 && shown === 0);
          d.body.classList.toggle("ux-filtering", words.length > 0);
        };
        let t = null;
        input.addEventListener("input", () => { clearTimeout(t); t = setTimeout(apply, 120); });
        input.addEventListener("keydown", (e) => { if (e.key === "Escape") { input.value = ""; apply(); } });
        clearBtn.addEventListener("click", () => { input.value = ""; apply(); input.focus(); });
      }
    });

    // تلميح «مرّر لعرض بقية الأعمدة» لأي حاوية ذات تمرير أفقي فعلي
    d.querySelectorAll(".table-wrap, .data-table").forEach((wrap) => {
      let hint = null;
      if (wrap.scrollWidth > wrap.clientWidth + 8) {
        hint = d.createElement("span");
        hint.className = "table-hint";
        hint.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg> ${uxT.scrollHint}`;
        wrap.after(hint);
      }
      const update = () => {
        const scrollable = wrap.scrollWidth > wrap.clientWidth + 8;
        wrap.classList.toggle("is-scrollable", scrollable);
        if (!scrollable) return;
        // في RTL يكون scrollLeft سالبًا في المتصفحات الحديثة
        const sl = Math.abs(wrap.scrollLeft);
        const max = wrap.scrollWidth - wrap.clientWidth;
        wrap.classList.toggle("at-start", sl < 8);
        wrap.classList.toggle("at-end", sl > max - 8);
        if (hint) hint.classList.toggle("is-visible", scrollable && sl < 8);
      };
      wrap.addEventListener("scroll", update, { passive: true });
      addEventListener("resize", update, { passive: true });
      update();
    });
  })();

  // 6) قائمة الموبايل — إغلاق عند اختيار رابط أو اللمس خارجها أو Escape
  (() => {
    const menu = d.querySelector("details.mobile-menu");
    if (!menu) return;
    menu.querySelectorAll("nav a").forEach((a) =>
      a.addEventListener("click", () => menu.removeAttribute("open"))
    );
    d.addEventListener("click", (e) => {
      if (menu.hasAttribute("open") && !e.target.closest("details.mobile-menu")) {
        menu.removeAttribute("open");
      }
    });
    d.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.hasAttribute("open")) {
        menu.removeAttribute("open");
        const s = menu.querySelector("summary");
        if (s) s.focus();
      }
    });
  })();
})();
