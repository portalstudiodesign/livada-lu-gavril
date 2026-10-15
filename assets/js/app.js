/* ============================================================
   Livada lu' Gavril — magazin (demo front-end)
   Coșul se ține în localStorage; comanda nu se trimite nicăieri
   în această propunere — în varianta live se leagă de un backend
   (WooCommerce / Shopify / API propriu) și procesator de plăți.
   ============================================================ */

/* ---------------- Utils ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const money = (n) => n.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " lei";
const byId = (id) => PRODUCTS.find((p) => p.id === id);
const img = (f) => `assets/img/${f}`;
const unitPrice = (p) => isJuice(p) ? money(p.price / p.liters) + " / L" : money(p.price / p.units) + " / " + p.unitLabel;

const ICON = {
  cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6h15l-1.5 9h-12z"/><path d="M6 6 5 3H2"/><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  fb: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7.5H16l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21z"/></svg>',
  ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none"/></svg>',
  truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
  leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19c0-8 5-13 15-14-1 10-6 15-14 15"/><path d="M5 19 13 11"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/></svg>',
  card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/></svg>',
};

/* ---------------- Cart store ---------------- */
const KEY = "lg_cart_v1";
let memCart = {};
function readCart() {
  try {
    const raw = localStorage.getItem(KEY);
    const c = raw ? JSON.parse(raw) : {};
    return Object.fromEntries(Object.entries(c).filter(([id, q]) => byId(id) && q > 0));
  } catch { return { ...memCart }; }
}
function writeCart(c) {
  memCart = { ...c };
  try { localStorage.setItem(KEY, JSON.stringify(c)); } catch {}
  document.dispatchEvent(new CustomEvent("cart:change"));
}
const Cart = {
  get: readCart,
  add(id, q = 1) { const c = readCart(); c[id] = Math.min(99, (c[id] || 0) + q); writeCart(c); },
  set(id, q) { const c = readCart(); if (q <= 0) delete c[id]; else c[id] = Math.min(99, q); writeCart(c); },
  clear() { writeCart({}); },
  lines() { return Object.entries(readCart()).map(([id, qty]) => ({ p: byId(id), qty })); },
  count() { return Object.values(readCart()).reduce((a, b) => a + b, 0); },
  subtotal() { return this.lines().reduce((s, l) => s + l.p.price * l.qty, 0); },
};

/* ---------------- Layout (header / footer / drawer) ---------------- */
function navLink(href, label, page) {
  const cur = document.body.dataset.page === page ? ' aria-current="page"' : "";
  return `<a href="${href}"${cur}>${label}</a>`;
}

function renderChrome() {
  const header = `
  <div class="topstrip">
    Livrare prin curier în toată țara <span class="sep">·</span> Gratuit peste ${SHOP.freeShipFrom} lei
    <span class="hide-sm"><span class="sep">·</span> Comenzi telefonice: <a href="${SHOP.phoneHref}">${SHOP.phone}</a></span>
  </div>
  <header class="site-header" id="top">
    <div class="wrap header-inner">
      <a class="brand" href="index.html" aria-label="Livada lu' Gavril — acasă"><img src="assets/img/logo.png" alt="Livada lu' Gavril" width="80" height="50"></a>
      <nav class="nav" id="nav" aria-label="Principal">
        ${navLink("index.html", "Acasă", "home")}
        ${navLink("magazin.html", "Magazin", "shop")}
        ${navLink("index.html#despre", "Despre noi", "-")}
        ${navLink("index.html#poveste", "De la livadă la pahar", "-")}
        ${navLink("index.html#vii-cu-mere", "Vii cu mere", "-")}
        ${navLink("index.html#contact", "Contact", "-")}
      </nav>
      <div class="header-actions">
        <button class="cart-btn" type="button" data-open-cart aria-label="Deschide coșul">
          ${ICON.cart}<span class="label">Coș</span><span class="cart-count" data-cart-count>0</span>
        </button>
        <button class="menu-btn" type="button" aria-label="Meniu" aria-expanded="false" aria-controls="nav">${ICON.menu}</button>
      </div>
    </div>
  </header>`;

  const footer = `
  <footer class="site-footer">
    <div class="wrap">
      <div class="footer-grid">
        <div>
          <span class="footer-logo"><img src="assets/img/logo.png" alt="Livada lu' Gavril"></span>
          <p>Suc natural de mere și aronia, presat la rece în livada noastră din Leucușești, lângă Fălticeni.</p>
          <div class="socials">
            <a href="${SHOP.facebook}" target="_blank" rel="noopener" aria-label="Facebook">${ICON.fb}</a>
            <a href="${SHOP.instagram}" target="_blank" rel="noopener" aria-label="Instagram">${ICON.ig}</a>
            <a href="${SHOP.phoneHref}" aria-label="Telefon">${ICON.phone}</a>
          </div>
        </div>
        <div>
          <h4>Magazin</h4>
          <ul>
            <li><a href="magazin.html?f=sticla">Suc la sticlă</a></li>
            <li><a href="magazin.html?f=bib">Bag-in-Box 3 L</a></li>
            <li><a href="magazin.html?f=aronia">Cu aronia</a></li>
            <li><a href="magazin.html?f=dulceata">Dulceață fără zahăr</a></li>
            <li><a href="cos.html">Coșul meu</a></li>
          </ul>
        </div>
        <div>
          <h4>Informații</h4>
          <ul>
            <li><a href="#">Livrare și retur</a></li>
            <li><a href="#">Termeni și condiții</a></li>
            <li><a href="#">Confidențialitate (GDPR)</a></li>
            <li><a href="#">Politica de cookie-uri</a></li>
          </ul>
        </div>
        <div>
          <h4>Contact</h4>
          <ul>
            <li><a href="${SHOP.phoneHref}">${SHOP.phone}</a></li>
            <li><a href="mailto:${SHOP.email}">${SHOP.email}</a></li>
            <li>Leucușești nr. 472, Ferma, str. Antilești, 725201, jud. Suceava</li>
            <li>L–V 08–19 · S 08–16</li>
          </ul>
          <div class="footer-legal">
            <a href="https://anpc.ro/ce-este-sal/" target="_blank" rel="noopener">ANPC · SAL</a>
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener">Soluționare online (SOL)</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© 2017–${new Date().getFullYear()} Livada Lu Gavril S.R.L. · CUI 37565241 · Nr. Reg. Com. J33/806/2017</span>
        <span>Propunere de site — prețurile afișate sunt orientative.</span>
      </div>
    </div>
  </footer>
  <div class="drawer-backdrop" data-close-cart></div>
  <aside class="drawer" aria-label="Coșul de cumpărături" aria-hidden="true">
    <div class="drawer-head">
      <h3>Coșul tău</h3>
      <button class="icon-btn" type="button" data-close-cart aria-label="Închide">${ICON.close}</button>
    </div>
    <div class="drawer-body" data-drawer-body></div>
    <div class="drawer-foot" data-drawer-foot></div>
  </aside>
  <div class="toast" role="status" aria-live="polite"></div>`;

  document.body.insertAdjacentHTML("afterbegin", header);
  document.body.insertAdjacentHTML("beforeend", footer);

  // mobile menu
  const btn = $(".menu-btn"), nav = $("#nav");
  btn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", open);
  });
  $$("#nav a").forEach((a) => a.addEventListener("click", () => { nav.classList.remove("open"); btn.setAttribute("aria-expanded", false); }));

  // header shadow
  const hdr = $(".site-header");
  const onScroll = () => hdr.classList.toggle("scrolled", window.scrollY > 10);
  onScroll(); window.addEventListener("scroll", onScroll, { passive: true });

  // drawer
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-open-cart]")) openDrawer();
    if (e.target.closest("[data-close-cart]")) closeDrawer();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });
}

function openDrawer() {
  document.body.classList.add("drawer-open");
  $(".drawer").setAttribute("aria-hidden", "false");
  $(".drawer .icon-btn").focus();
}
function closeDrawer() {
  document.body.classList.remove("drawer-open");
  $(".drawer")?.setAttribute("aria-hidden", "true");
}

function shipMeter(sub) {
  const left = SHOP.freeShipFrom - sub;
  const pct = Math.min(100, (sub / SHOP.freeShipFrom) * 100);
  const msg = left > 0
    ? `Mai adaugă <b>${money(left)}</b> și livrarea e gratuită.`
    : `<b>Livrarea e gratuită</b> pentru comanda ta.`;
  return `<div class="ship-meter">${msg}<div class="bar"><i style="width:${pct}%"></i></div></div>`;
}

function lineHTML({ p, qty }, small = false) {
  return `
  <div class="line" data-id="${p.id}">
    <img src="${img(p.img)}" alt="" loading="lazy">
    <div>
      <h4>${p.name}</h4>
      <div class="fmt">${p.format} · ${money(p.price)}</div>
      ${small ? `<div class="fmt">Cantitate: ${qty}</div>` : `
      <div class="qty sm">
        <button type="button" data-dec aria-label="Scade">−</button>
        <input type="number" min="1" max="99" value="${qty}" aria-label="Cantitate" data-qty>
        <button type="button" data-inc aria-label="Crește">+</button>
      </div>`}
    </div>
    <div class="right">
      <span class="lp">${money(p.price * qty)}</span>
      ${small ? "" : `<button type="button" class="remove" data-remove>Șterge</button>`}
    </div>
  </div>`;
}

function bindLineControls(root) {
  root.addEventListener("click", (e) => {
    const line = e.target.closest(".line"); if (!line) return;
    const id = line.dataset.id, q = Cart.get()[id] || 0;
    if (e.target.closest("[data-inc]")) Cart.set(id, q + 1);
    if (e.target.closest("[data-dec]")) Cart.set(id, q - 1);
    if (e.target.closest("[data-remove]")) Cart.set(id, 0);
  });
  root.addEventListener("change", (e) => {
    if (!e.target.matches("[data-qty]")) return;
    const id = e.target.closest(".line").dataset.id;
    Cart.set(id, parseInt(e.target.value, 10) || 0);
  });
}

function renderDrawer() {
  const body = $("[data-drawer-body]"), foot = $("[data-drawer-foot]");
  const lines = Cart.lines();
  if (!lines.length) {
    body.innerHTML = `<div class="drawer-empty">${ICON.cart}<p>Coșul e gol deocamdată.</p><a class="btn btn-primary" href="magazin.html">Mergi la magazin</a></div>`;
    foot.innerHTML = "";
    return;
  }
  const sub = Cart.subtotal();
  body.innerHTML = lines.map((l) => lineHTML(l)).join("");
  foot.innerHTML = `
    ${shipMeter(sub)}
    <div class="sum-row total"><span>Subtotal</span><span>${money(sub)}</span></div>
    <a class="btn btn-primary btn-block" href="cos.html">Finalizează comanda</a>`;
}

function updateCount() {
  $$("[data-cart-count]").forEach((el) => {
    const n = Cart.count();
    if (el.textContent !== String(n)) { el.textContent = n; el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
  });
}

let toastTimer;
function toast(html) {
  const t = $(".toast");
  t.innerHTML = ICON.check + `<span>${html}</span>`;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

/* ---------------- Product card ---------------- */
function cardHTML(p) {
  const tags = [
    p.tags.includes("bib") ? `<span class="tag bib">3 litri</span>` : "",
    p.tags.includes("aronia") ? `<span class="tag aronia">Aronia</span>` : "",
    p.badge ? `<span class="tag promo">${p.badge}</span>` : "",
    isJuice(p) ? `<span class="tag">Presat la rece</span>` : `<span class="tag">Fără zahăr</span>`,
  ].join("");
  return `
  <article class="card reveal">
    <a class="card-media" href="produs.html?id=${p.id}" aria-label="${p.name}, ${p.format}">
      <img src="${img(p.img)}" alt="${p.name} — ${p.format}" loading="lazy">
      <div class="card-tags">${tags}</div>
    </a>
    <div class="card-body">
      <h3><a href="produs.html?id=${p.id}">${p.name}</a></h3>
      <div class="card-format">${p.format}</div>
      <p class="card-desc">${p.short}</p>
      <div class="card-foot">
        <div class="price">${money(p.price)}<small>${unitPrice(p)}</small></div>
        <button class="add-btn" type="button" data-add="${p.id}" aria-label="Adaugă ${p.name}, ${p.format} în coș">${ICON.plus}</button>
      </div>
    </div>
  </article>`;
}

function bindAddButtons(root = document) {
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-add]"); if (!b) return;
    const p = byId(b.dataset.add);
    Cart.add(p.id, 1);
    if (b.classList.contains("add-btn")) {
      b.classList.add("added"); b.innerHTML = ICON.check;
      setTimeout(() => { b.classList.remove("added"); b.innerHTML = ICON.plus; }, 1400);
    }
    toast(`<b>${p.name}</b> (${p.format}) a fost adăugat în coș`);
  });
}

/* ---------------- Reveal on scroll ---------------- */
function reveal() {
  const els = $$(".reveal:not(.in)");
  if (!("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("in")); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -40px 0px" });
  els.forEach((el) => io.observe(el));
}

/* ---------------- Pages ---------------- */
const pages = {
  home() {
    $("#home-products").innerHTML = PRODUCTS.slice(0, 4).map(cardHTML).join("");
  },

  shop() {
    const grid = $("#shop-grid"), chips = $$(".chip"), sortSel = $("#sort");
    let filter = new URLSearchParams(location.search).get("f") || "all";
    const draw = () => {
      let list = PRODUCTS.filter((p) => filter === "all" || p.tags.includes(filter));
      const s = sortSel.value;
      if (s === "asc") list = [...list].sort((a, b) => a.price - b.price);
      if (s === "desc") list = [...list].sort((a, b) => b.price - a.price);
      if (s === "unit") list = [...list].sort((a, b) => (isJuice(a) ? a.price / a.liters : Infinity) - (isJuice(b) ? b.price / b.liters : Infinity));
      grid.innerHTML = list.length ? list.map(cardHTML).join("") : `<p class="empty">Niciun produs în această categorie.</p>`;
      chips.forEach((c) => c.setAttribute("aria-pressed", c.dataset.f === filter));
      $("#shop-count").textContent = `${list.length} ${list.length === 1 ? "produs" : "produse"}`;
      reveal();
    };
    chips.forEach((c) => c.addEventListener("click", () => {
      filter = c.dataset.f;
      const u = new URL(location.href);
      filter === "all" ? u.searchParams.delete("f") : u.searchParams.set("f", filter);
      history.replaceState(null, "", u);
      draw();
    }));
    sortSel.addEventListener("change", draw);
    draw();
  },

  product() {
    const p = byId(new URLSearchParams(location.search).get("id")) || PRODUCTS[0];
    document.title = `${p.name} — ${p.format} · Livada lu' Gavril`;
    const variants = PRODUCTS.filter((v) => v.family === p.family);
    const root = $("#pdp");
    root.innerHTML = `
      <div class="pdp-gallery">
        <div class="pdp-main"><img id="pdp-img" src="${img(p.gallery[0])}" alt="${p.name} — ${p.format}"></div>
        <div class="pdp-thumbs">
          ${p.gallery.map((g, i) => `<button type="button" data-img="${g}" aria-current="${i === 0}" aria-label="Imaginea ${i + 1}"><img src="${img(g)}" alt="" loading="lazy"></button>`).join("")}
        </div>
      </div>
      <div>
        <nav class="breadcrumb"><a href="index.html">Acasă</a> / <a href="magazin.html">Magazin</a> / ${p.name}</nav>
        <h1>${p.name}</h1>
        <div class="pdp-format">${p.format}${isJuice(p) ? " · presat la rece" : ""}${p.badge ? ` · <b style="color:var(--apple)">${p.badge}</b>` : ""}</div>
        <div class="pdp-price">${money(p.price)}</div>
        <div class="pdp-unit">${unitPrice(p)} · TVA inclus</div>
        ${variants.length > 1 ? `<div class="variant-switch" aria-label="Format">
          ${variants.map((v) => `<a href="produs.html?id=${v.id}" aria-current="${v.id === p.id}">${v.format}<small>${money(v.price)}</small></a>`).join("")}
        </div>` : ""}
        <div class="buy-row">
          <div class="qty">
            <button type="button" id="q-dec" aria-label="Scade">−</button>
            <input type="number" id="q" value="1" min="1" max="99" aria-label="Cantitate">
            <button type="button" id="q-inc" aria-label="Crește">+</button>
          </div>
          <button class="btn btn-primary" type="button" id="buy">${ICON.cart} Adaugă în coș</button>
        </div>
        <div class="pdp-highlights">
          ${(p.highlights || DEFAULT_HIGHLIGHTS).map((h) => `<div>${ICON.check} ${h}</div>`).join("")}
        </div>
        <p class="lead">${p.desc}</p>
        <details class="acc" open><summary>Ingrediente</summary><p>${p.ingredients}</p></details>
        <details class="acc"><summary>Păstrare</summary><p>${p.storage}</p></details>
        <details class="acc"><summary>Livrare</summary><p>Livrăm prin curier în toată țara, în 1–3 zile lucrătoare. Transport ${money(SHOP.courier)}, gratuit pentru comenzi peste ${SHOP.freeShipFrom} lei. Poți ridica gratuit comanda direct de la fabrică, din Leucușești.</p></details>
      </div>`;

    $$(".pdp-thumbs button").forEach((b) => b.addEventListener("click", () => {
      $("#pdp-img").src = img(b.dataset.img);
      $$(".pdp-thumbs button").forEach((x) => x.setAttribute("aria-current", x === b));
    }));
    const q = $("#q");
    const clamp = (v) => Math.max(1, Math.min(99, v || 1));
    $("#q-dec").onclick = () => (q.value = clamp(+q.value - 1));
    $("#q-inc").onclick = () => (q.value = clamp(+q.value + 1));
    q.onchange = () => (q.value = clamp(+q.value));
    $("#buy").onclick = () => {
      Cart.add(p.id, clamp(+q.value));
      openDrawer();
    };

    $("#related").innerHTML = PRODUCTS.filter((x) => x.id !== p.id).slice(0, 4).map(cardHTML).join("");
  },

  checkout() {
    const sumEl = $("#summary"), form = $("#order-form");
    bindLineControls($("#cart-lines"));

    const shipping = () => {
      const method = form.elements.delivery.value;
      if (method === "pickup") return 0;
      return Cart.subtotal() >= SHOP.freeShipFrom ? 0 : SHOP.courier;
    };
    let placed = false;
    const draw = () => {
      if (placed) return;
      const lines = Cart.lines();
      if (!lines.length) {
        $("#checkout-wrap").hidden = true;
        $("#cart-empty").hidden = false;
        return;
      }
      const sub = Cart.subtotal(), ship = shipping();
      const cod = form.elements.payment.value === "cod" && form.elements.delivery.value === "courier";
      $("#cart-lines").innerHTML = lines.map((l) => lineHTML(l)).join("");
      $("#ship-price").textContent = sub >= SHOP.freeShipFrom ? "Gratuit" : money(SHOP.courier);
      const pickup = form.elements.delivery.value === "pickup";
      sumEl.innerHTML = `
        ${pickup ? "" : shipMeter(sub)}
        <div class="sum-row"><span>Subtotal</span><span>${money(sub)}</span></div>
        <div class="sum-row"><span>Livrare</span><span>${ship ? money(ship) : "Gratuit"}</span></div>
        <div class="sum-row total"><span>Total</span><span>${money(sub + ship)}</span></div>
        <p class="note">${cod ? "Plătești la curier, la primirea coletului." : "Prețurile includ TVA."}</p>`;
    };
    form.addEventListener("change", (e) => { if (["delivery", "payment"].includes(e.target.name)) draw(); });
    document.addEventListener("cart:change", draw);
    draw();

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const total = Cart.subtotal() + shipping();
      const nr = "LG-" + Date.now().toString().slice(-6);
      const name = form.elements.name.value.trim().split(" ")[0];
      placed = true;
      Cart.clear();
      $(".page-hero h1").textContent = "Comanda e gata";
      $("#checkout-wrap").hidden = true;
      const ok = $("#success");
      ok.hidden = false;
      $("#ok-nr").textContent = nr;
      $("#ok-name").textContent = name;
      $("#ok-total").textContent = money(total);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  },
};

/* ---------------- Boot ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  renderChrome();
  bindAddButtons();
  bindLineControls($("[data-drawer-body]"));
  const page = document.body.dataset.page;
  pages[page]?.();
  renderDrawer(); updateCount(); reveal();
  document.addEventListener("cart:change", () => { renderDrawer(); updateCount(); });
  window.addEventListener("storage", (e) => { if (e.key === KEY) document.dispatchEvent(new CustomEvent("cart:change")); });
});
