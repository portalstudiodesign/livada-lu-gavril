/* ============================================================
   Livada lu' Gavril — v2 · "Un an într-un pahar"
   GSAP + ScrollTrigger + SplitText + Lenis.
   Coșul folosește aceeași cheie ca v1, deci comanda se finalizează în ../cos.html.
   ============================================================ */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const money = (n) => n.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " lei";
  const IMG = (f) => `../assets/img/${f}`;
  const byId = (id) => PRODUCTS.find((p) => p.id === id);
  const unitPrice = (p) => isJuice(p) ? money(p.price / p.liters) + " / L" : money(p.price / p.units) + " / " + p.unitLabel;

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motion = !reduced && typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";

  /* =========================================================
     CART (aceeași cheie ca în v1)
     ========================================================= */
  const KEY = "lg_cart_v1";
  let mem = {};
  const read = () => {
    try {
      const c = JSON.parse(localStorage.getItem(KEY) || "{}");
      return Object.fromEntries(Object.entries(c).filter(([id, q]) => byId(id) && q > 0));
    } catch { return { ...mem }; }
  };
  const write = (c) => {
    mem = { ...c };
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch {}
    renderCart();
  };
  const Cart = {
    add(id, q = 1) { const c = read(); c[id] = Math.min(99, (c[id] || 0) + q); write(c); },
    set(id, q) { const c = read(); q > 0 ? (c[id] = Math.min(99, q)) : delete c[id]; write(c); },
    lines: () => Object.entries(read()).map(([id, qty]) => ({ p: byId(id), qty })),
    count: () => Object.values(read()).reduce((a, b) => a + b, 0),
  };

  function renderCart() {
    const lines = Cart.lines();
    const n = Cart.count();
    $$("[data-cart-count]").forEach((el) => {
      if (el.textContent !== String(n) && motion) gsap.fromTo(el, { scale: 1.6 }, { scale: 1, duration: .6, ease: "elastic.out(1, .4)" });
      el.textContent = n;
    });
    const body = $("[data-drawer-body]"), foot = $("[data-drawer-foot]");
    if (!lines.length) {
      body.innerHTML = `<div class="drawer-empty"><p>Coșul e gol deocamdată.</p></div>`;
      foot.innerHTML = `<a class="checkout" href="#sucuri" data-close-cart>Alege un suc</a>`;
      return;
    }
    const sub = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
    const left = SHOP.freeShipFrom - sub;
    body.innerHTML = lines.map(({ p, qty }) => `
      <div class="ln" data-id="${p.id}">
        <img src="${IMG(p.img)}" alt="">
        <div><b>${p.name}</b><small>${p.format}</small>
          <div class="q"><button type="button" data-dec aria-label="Scade">−</button><span>${qty}</span><button type="button" data-inc aria-label="Crește">+</button></div>
        </div>
        <span class="lp">${money(p.price * qty)}</span>
      </div>`).join("");
    foot.innerHTML = `
      <div class="sum"><span>Subtotal</span><span>${money(sub)}</span></div>
      <a class="checkout" href="../cos.html">Finalizează comanda</a>
      <p class="drawer-note">${left > 0 ? `Mai adaugă ${money(left)} pentru livrare gratuită.` : "Livrarea e gratuită pentru comanda ta."}</p>`;
  }

  $("[data-drawer-body]").setAttribute("data-lenis-prevent", "");
  $("[data-drawer-body]").addEventListener("click", (e) => {
    const ln = e.target.closest(".ln"); if (!ln) return;
    const q = read()[ln.dataset.id] || 0;
    if (e.target.closest("[data-inc]")) Cart.set(ln.dataset.id, q + 1);
    if (e.target.closest("[data-dec]")) Cart.set(ln.dataset.id, q - 1);
  });

  let lenis = null;
  const openCart = () => { document.body.classList.add("cart-open"); $(".drawer").setAttribute("aria-hidden", "false"); lenis?.stop(); $(".drawer .x").focus(); };
  const closeCart = () => { document.body.classList.remove("cart-open"); $(".drawer").setAttribute("aria-hidden", "true"); lenis?.start(); };
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-open-cart]")) openCart();
    if (e.target.closest("[data-close-cart]")) closeCart();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCart(); });
  window.addEventListener("storage", (e) => { if (e.key === KEY) renderCart(); });

  let toastT;
  const toast = (html) => {
    const t = $(".toast"); t.innerHTML = html; t.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600);
  };

  /* ---------- product variants inside the color-morph section ---------- */
  $$("[data-variants]").forEach((el) => {
    el.innerHTML = PRODUCTS.filter((p) => p.family === el.dataset.variants).map((p) => `
      <div class="variant">
        <a class="variant-name" href="../produs.html?id=${p.id}" data-cursor="Detalii">${p.format}<small>${unitPrice(p)}</small></a>
        <span class="variant-price">${money(p.price)}</span>
        <button class="add" type="button" data-add="${p.id}"><span>Adaugă în coș</span></button>
      </div>`).join("");
  });
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-add]"); if (!b) return;
    const p = byId(b.dataset.add);
    Cart.add(p.id);
    b.classList.add("done"); b.firstElementChild.textContent = "Adăugat ✓";
    setTimeout(() => { b.classList.remove("done"); b.firstElementChild.textContent = "Adaugă în coș"; }, 1500);
    toast(`<b>${p.name}</b> · ${p.format} a fost adăugat în coș`);
  });

  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
  renderCart();

  // numele mare din final umple exact lățimea disponibilă, pe orice ecran
  const fitEndWord = () => {
    const box = $(".end-word"), word = $("[data-split-end]", box);
    box.style.fontSize = "";
    const fs = parseFloat(getComputedStyle(box).fontSize);
    box.style.fontSize = (fs * box.clientWidth / word.getBoundingClientRect().width * .985) + "px";
  };
  (document.fonts ? document.fonts.load('400 1em "Instrument Serif"') : Promise.resolve()).then(fitEndWord, fitEndWord);
  document.fonts?.addEventListener("loadingdone", fitEndWord);
  window.addEventListener("load", fitEndWord);
  window.addEventListener("resize", fitEndWord);

  /* =========================================================
     FĂRĂ ANIMAȚII (reduced motion sau CDN indisponibil)
     ========================================================= */
  /* ---------- HERO: video (cadru + fundal estompat pe desktop) ---------- */
  const heroVideo = $(".hero-video");
  const heroVids = [heroVideo, $(".hero-video-bg")];
  const isDesktop = () => matchMedia("(min-width: 861px)").matches;
  const loadHeroVideo = () => {
    heroVids.forEach((v) => {
      if (v === heroVids[1] && !isDesktop()) return; // fundalul estompat e doar pe desktop
      if (!v.getAttribute("src")) { v.src = v.dataset.src; v.preload = "auto"; }
    });
    return heroVideo;
  };
  const playHeroVideo = () => heroVids.forEach((v) => v.getAttribute("src") && v.play().catch(() => {}));
  const pauseHeroVideo = () => heroVids.forEach((v) => v.pause());

  if (!motion) {
    if (!reduced) { loadHeroVideo(); playHeroVideo(); }
    $(".loader")?.remove();
    $(".year").classList.add("is-stacked");
    $(".factory").classList.add("is-stacked");
    const v = $(".tri-c video"); if (v && !reduced) v.play().catch(() => {});
    return;
  }

  /* =========================================================
     MOTION
     ========================================================= */
  gsap.registerPlugin(ScrollTrigger, SplitText);
  history.scrollRestoration = "manual";
  window.scrollTo(0, 0);

  // ---------- Lenis smooth scroll ----------
  if (typeof Lenis !== "undefined") {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const target = a.getAttribute("href") === "#top" ? 0 : $(a.getAttribute("href"));
    if (target === null) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(target, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) }) : (target === 0 ? scrollTo(0, 0) : target.scrollIntoView());
  });

  // ---------- helpers ----------
  $$(".reveal-line").forEach((el) => (el.innerHTML = `<span class="rl">${el.innerHTML}</span>`));
  const revealHeading = (heading, trigger = heading, start = "top 82%") =>
    gsap.from($$(".rl", heading), {
      yPercent: 115, rotate: 3, duration: 1.3, ease: "expo.out", stagger: .12,
      scrollTrigger: { trigger, start },
    });
  const fadeUps = (els) => els.forEach((el) =>
    gsap.from(el, { y: 50, opacity: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } }));

  // ---------- progress bar ----------
  gsap.to(".progress i", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: .3 } });

  // ---------- header hide/show ----------
  const hdr = $(".hdr");
  ScrollTrigger.create({
    start: "top -120",
    onUpdate: (self) => gsap.to(hdr, { yPercent: self.direction === 1 ? -160 : 0, duration: .5, ease: "power3.out", overwrite: true }),
    onLeaveBack: () => gsap.to(hdr, { yPercent: 0, duration: .5, overwrite: true }),
  });

  /* ---------- 01 · HERO ---------- */
  const heroChars = new SplitText(".hero-title [data-split]", { type: "chars" }).chars;
  gsap.set(heroChars, { yPercent: 115 });
  gsap.set([".hero-kicker", ".hero-foot"], { opacity: 0, y: 24 });
  gsap.set(".hero-media", { scale: 1.25 });

  // video-ul pornește odată cu ridicarea cortinei și se oprește când ieși din hero
  let started = false;
  loadHeroVideo();
  window.addEventListener("resize", () => { loadHeroVideo(); if (started) playHeroVideo(); });
  ScrollTrigger.create({
    trigger: ".hero", start: "top bottom", end: "bottom top",
    onToggle: (s) => (s.isActive && started ? playHeroVideo() : pauseHeroVideo()),
  });
  const startSeq = () => { started = true; playHeroVideo(); };

  const heroIntro = () => gsap.timeline()
    .add(() => startSeq(), .3)
    .to(".hero-media", { scale: 1, duration: 2.4, ease: "expo.out" }, 0)
    .to(heroChars, { yPercent: 0, duration: 1.4, ease: "expo.out", stagger: .035 }, .15)
    .to([".hero-kicker", ".hero-foot"], { opacity: 1, y: 0, duration: 1.1, ease: "power3.out", stagger: .1 }, .7);

  gsap.timeline({
    scrollTrigger: { trigger: ".hero", start: "top top", end: "+=110%", scrub: true, pin: true },
  })
    .fromTo(".hero-media", { clipPath: "inset(0% 0% 0% 0% round 0px)" }, { clipPath: "inset(12% 8% 12% 8% round 28px)", ease: "none" }, 0)
    .fromTo(".hero-video", { scale: 1.08 }, { scale: .92, ease: "none" }, 0)
    .fromTo(".hero-video-bg", { scale: 1.15 }, { scale: 1, ease: "none" }, 0)
    .to(".hero-title .line:first-child", { xPercent: -18, opacity: 0, ease: "none" }, 0)
    .to(".hero-title .line-2", { xPercent: 18, opacity: 0, ease: "none" }, 0)
    // copiii, nu containerele: containerele sunt animate de intro (altfel scrub-ul le blochează la opacity 0)
    .fromTo([".hero-kicker > span", ".hero-foot > *"], { opacity: 1 }, { opacity: 0, ease: "none", duration: .4, immediateRender: false }, 0)
    .to(".hero-shade", { opacity: .4, ease: "none" }, 0);

  /* ---------- LOADER ---------- */
  // cortina așteaptă video-ul din hero (max. 4 s)
  const imgReady = Promise.race([
    new Promise((r) => { const v = loadHeroVideo(); v.readyState >= 3 ? r() : (v.addEventListener("canplay", r, { once: true }), v.addEventListener("error", r, { once: true })); }),
    new Promise((r) => setTimeout(r, 4000)),
  ]);
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  const counter = { v: 0 };
  const countTween = gsap.to(counter, {
    v: 100, duration: 1.8, ease: "power2.inOut",
    onUpdate: () => {
      $(".loader-count").textContent = String(Math.round(counter.v)).padStart(3, "0");
      gsap.set(".loader-line i", { scaleX: counter.v / 100 });
    },
  });
  Promise.all([imgReady, fontsReady, countTween.then()]).then(() => {
    gsap.timeline({
      onComplete: () => { $(".loader").remove(); fitEndWord(); lenis?.start(); ScrollTrigger.refresh(); },
    })
      .to(".loader-inner", { y: -40, opacity: 0, duration: .6, ease: "power3.in" })
      .to(".loader", { clipPath: "inset(0% 0% 100% 0%)", duration: 1.15, ease: "expo.inOut" }, "-=.1")
      .add(heroIntro(), "-=.75");
  });

  /* ---------- 02 · MANIFEST (cuvânt cu cuvânt) ---------- */
  const mt = $(".manifest-text");
  [...mt.childNodes].forEach((node) => {
    if (node.nodeType !== 3 || !node.textContent.trim()) return;
    const frag = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) frag.append(" ");
      else { const s = document.createElement("span"); s.className = "w"; s.textContent = part; frag.append(s); }
    });
    node.replaceWith(frag);
  });
  const mtl = gsap.timeline({ scrollTrigger: { trigger: mt, start: "top 78%", end: "bottom 40%", scrub: true } });
  $$(".w", mt).forEach((el, i) => mtl.fromTo(el, { opacity: .12 }, { opacity: 1, duration: .3 }, i * .1));

  /* ---------- 03 · UN AN (orizontal pe desktop, vertical pe mobil) ---------- */
  revealHeading($(".year-intro h2"), ".year", "top 55%");
  gsap.from(".year-intro p", { opacity: 0, y: 30, duration: 1, delay: .4, scrollTrigger: { trigger: ".year", start: "top 55%" } });

  const mm = gsap.matchMedia();
  mm.add("(min-width: 861px)", () => {
    const track = $(".year-track");
    const dist = () => track.scrollWidth - window.innerWidth;
    const hTween = gsap.to(track, {
      x: () => -dist(), ease: "none",
      scrollTrigger: {
        trigger: ".year-pin", start: "top top", end: () => "+=" + dist(), scrub: 1, pin: true, invalidateOnRefresh: true,
        onUpdate: (self) => gsap.set(".year-progress i", { scaleX: self.progress }),
      },
    });
    $$(".chapter").forEach((ch) => {
      gsap.fromTo($(".chapter-img img", ch), { xPercent: -7 }, {
        xPercent: 7, ease: "none",
        scrollTrigger: { trigger: ch, containerAnimation: hTween, start: "left right", end: "right left", scrub: true },
      });
      gsap.fromTo($(".chapter-img", ch), { clipPath: "inset(0% 0% 0% 100% round 22px)" }, {
        clipPath: "inset(0% 0% 0% 0% round 22px)", ease: "none",
        scrollTrigger: { trigger: ch, containerAnimation: hTween, start: "left 95%", end: "left 35%", scrub: true },
      });
      gsap.from($$(".chapter-text > *", ch), {
        x: 80, opacity: 0, duration: 1, ease: "power3.out", stagger: .08,
        scrollTrigger: { trigger: ch, containerAnimation: hTween, start: "left 55%" },
      });
    });
  });
  mm.add("(max-width: 860px)", () => {
    $(".year").classList.add("is-stacked");
    $$(".chapter").forEach((ch) => {
      gsap.from($(".chapter-img", ch), { clipPath: "inset(20% 10% 20% 10% round 22px)", duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ch, start: "top 85%" } });
      fadeUps($$(".chapter-text > *", ch));
    });
    return () => $(".year").classList.remove("is-stacked");
  });

  /* ---------- 04 · FABRICA (triptic care se deschide) ---------- */
  const video = $(".tri-c video");
  revealHeading($(".factory-title"), ".factory", "top 60%");
  mm.add("(min-width: 861px)", () => {
    gsap.timeline({
      scrollTrigger: {
        trigger: ".factory-pin", start: "top top", end: "+=130%", scrub: 1, pin: true,
        onEnter: () => video.play().catch(() => {}), onEnterBack: () => video.play().catch(() => {}),
        onLeave: () => video.pause(), onLeaveBack: () => video.pause(),
      },
    })
      .from(".tri-l", { xPercent: -80, rotate: -8, opacity: 0, ease: "power2.out" }, 0)
      .from(".tri-r", { xPercent: 80, rotate: 8, opacity: 0, ease: "power2.out" }, 0)
      .fromTo(".tri-c", { height: "54vh" }, { height: "80vh", ease: "power1.inOut" }, .25)
      .to(".factory-title", { yPercent: -60, opacity: 0, ease: "none" }, .35)
      .to([".tri-l", ".tri-r"], { scale: .9, opacity: .55, ease: "none" }, .5);
  });
  mm.add("(max-width: 860px)", () => {
    $(".factory").classList.add("is-stacked");
    ScrollTrigger.create({ trigger: video, start: "top 90%", end: "bottom 10%", onToggle: (s) => (s.isActive ? video.play().catch(() => {}) : video.pause()) });
    $$(".tri").forEach((t) => gsap.from(t, { y: 60, opacity: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: t, start: "top 90%" } }));
    return () => $(".factory").classList.remove("is-stacked");
  });

  /* ---------- 05 · SUCURILE (fundalul își schimbă culoarea) ---------- */
  const juices = $(".juices");
  const jvs = $$(".jv");
  let cur = 0, z = 10;
  gsap.set(jvs, { clipPath: "inset(100% 0% 0% 0% round 28px)" });
  gsap.set(jvs[0], { clipPath: "inset(0% 0% 0% 0% round 28px)", zIndex: z });
  const isLight = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 140;
  };
  const activate = (i) => {
    const card = $$(".juice")[i];
    gsap.to(juices, { backgroundColor: card.dataset.bg, color: card.dataset.fg, duration: 1, ease: "power2.out" });
    juices.dataset.dark = isLight(card.dataset.bg) ? "0" : "1";
    if (i === cur) return;
    const dir = i > cur ? 1 : -1, el = jvs[i];
    gsap.set(el, { zIndex: ++z });
    gsap.fromTo(el, { clipPath: dir > 0 ? "inset(100% 0% 0% 0% round 28px)" : "inset(0% 0% 100% 0% round 28px)" },
      { clipPath: "inset(0% 0% 0% 0% round 28px)", duration: 1.1, ease: "expo.inOut" });
    gsap.fromTo($("img", el), { scale: 1.35 }, { scale: 1, duration: 1.6, ease: "expo.out" });
    const idx = $(".jv-cur");
    gsap.timeline().to(idx, { yPercent: -60 * dir, opacity: 0, duration: .25 })
      .add(() => (idx.textContent = String(i + 1).padStart(2, "0")))
      .fromTo(idx, { yPercent: 60 * dir, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .35 });
    cur = i;
  };
  juices.dataset.dark = "0";
  $$(".juice").forEach((card, i) => {
    ScrollTrigger.create({ trigger: card, start: "top 55%", end: "bottom 55%", onToggle: (s) => s.isActive && activate(i) });
    gsap.from($$(".juice-img, h3, .juice-lead, .variant", card), {
      y: 60, opacity: 0, duration: 1.1, ease: "expo.out", stagger: .08,
      scrollTrigger: { trigger: card, start: "top 70%" },
    });
  });
  gsap.to(".juices-visual .jv", { rotate: 4, yPercent: -4, ease: "none", scrollTrigger: { trigger: juices, start: "top bottom", end: "bottom top", scrub: true } });

  /* ---------- 06 · CIFRE ---------- */
  $$("[data-count]").forEach((el) => {
    const to = +el.dataset.count, from = +(el.dataset.from || 0), dec = +(el.dataset.decimals || 0);
    const o = { v: from };
    const fmt = (v) => v.toLocaleString("ro-RO", { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: false });
    el.textContent = fmt(from);
    gsap.to(o, {
      v: to, duration: 2.2, ease: "power3.out",
      onUpdate: () => (el.textContent = fmt(o.v)),
      scrollTrigger: { trigger: el, start: "top 88%" },
    });
  });
  gsap.from(".stat", { y: 60, opacity: 0, duration: 1.1, ease: "power3.out", stagger: .1, scrollTrigger: { trigger: ".stats", start: "top 80%" } });

  /* ---------- 07 · OAMENII ---------- */
  gsap.fromTo(".people-img", { clipPath: "inset(28% 22% 28% 22% round 26px)" }, {
    clipPath: "inset(0% 0% 0% 0% round 26px)", ease: "none",
    scrollTrigger: { trigger: ".people", start: "top 85%", end: "center 55%", scrub: true },
  });
  gsap.fromTo(".people-img img", { scale: 1.35 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".people", start: "top 85%", end: "bottom top", scrub: true } });
  revealHeading($(".people-text h2"));

  /* ---------- 08 · COLAJ PARALAX ---------- */
  $$(".collage [data-speed]").forEach((fig) => {
    const s = +fig.dataset.speed;
    gsap.fromTo(fig, { y: (s - 1) * 500 }, {
      y: (1 - s) * 500, ease: "none",
      scrollTrigger: { trigger: ".collage", start: "top bottom", end: "bottom top", scrub: true },
    });
  });
  const quoteLines = new SplitText(".collage-quote", { type: "lines,words", linesClass: "q-line" });
  gsap.from(quoteLines.words, {
    yPercent: 100, opacity: 0, duration: 1, ease: "expo.out", stagger: .04,
    scrollTrigger: { trigger: ".collage-quote", start: "top 75%" },
  });

  /* ---------- 09 · MARQUEE reactiv la viteza de scroll ---------- */
  const marquee = gsap.to(".marquee-track", { xPercent: -50, repeat: -1, duration: 22, ease: "none" });
  const skewTo = gsap.quickTo(".marquee-track", "skewX", { duration: .5, ease: "power3" });
  ScrollTrigger.create({
    trigger: ".bring", start: "top bottom", end: "bottom top",
    onUpdate: (self) => {
      const v = self.getVelocity();
      gsap.to(marquee, { timeScale: 1 + Math.min(6, Math.abs(v) / 300), duration: .2, overwrite: true,
        onComplete: () => gsap.to(marquee, { timeScale: 1, duration: 1.2 }) });
      skewTo(gsap.utils.clamp(-10, 10, v / -250));
    },
    onLeave: () => skewTo(0), onLeaveBack: () => skewTo(0),
  });
  fadeUps($$(".fade-up"));

  /* ---------- 10 · FINAL ---------- */
  revealHeading($(".end-cta h2"));
  const endChars = new SplitText("[data-split-end]", { type: "chars", charsClass: "ch" }).chars;
  gsap.from(endChars, {
    yPercent: 105, duration: 1.2, ease: "expo.out", stagger: .035,
    scrollTrigger: { trigger: ".end-word", start: "top 98%" },
  });
  gsap.from(".end-grid > div", { y: 40, opacity: 0, duration: 1, ease: "power3.out", stagger: .07, scrollTrigger: { trigger: ".end-grid", start: "top 92%" } });

  /* ---------- CURSOR + MAGNETIC ---------- */
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const cursor = $(".cursor"), label = $(".cursor-label");
    const cx = gsap.quickTo(cursor, "x", { duration: .45, ease: "power3" });
    const cy = gsap.quickTo(cursor, "y", { duration: .45, ease: "power3" });
    window.addEventListener("pointermove", (e) => { cx(e.clientX); cy(e.clientY); });
    document.addEventListener("pointerover", (e) => {
      const t = e.target.closest("[data-cursor], a, button");
      cursor.classList.remove("is-label", "is-hover");
      if (!t) return;
      if (t.dataset.cursor) { label.textContent = t.dataset.cursor; cursor.classList.add("is-label"); }
      else cursor.classList.add("is-hover");
    });
    $$(".magnetic").forEach((el) => {
      const mx = gsap.quickTo(el, "x", { duration: .6, ease: "power3" });
      const my = gsap.quickTo(el, "y", { duration: .6, ease: "power3" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * .3);
        my((e.clientY - r.top - r.height / 2) * .4);
      });
      el.addEventListener("pointerleave", () => { mx(0); my(0); });
    });
  }

  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
