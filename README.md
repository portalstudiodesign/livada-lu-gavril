# Livada lu' Gavril — propunere site + magazin online

Propunere de site pentru Livada Lu Gavril S.R.L. (Leucușești, jud. Suceava): suc natural de mere și mere cu aronia, la sticlă și Bag-in-Box 3 L, plus dulceață fără zahăr.

Două versiuni, cu același coș de cumpărături:

| Versiune | Intrare | Descriere |
|---|---|---|
| v1 — clasică | `index.html` | Prezentare + magazin: `magazin.html`, `produs.html?id=…`, `cos.html` (coș și comandă) |
| v2 — cinematică | `v2/index.html` | „Un an într-un pahar”: poveste la scroll (GSAP + ScrollTrigger + SplitText + Lenis) |

## Rulare locală

Site static, fără build. Orice server static din rădăcina proiectului:

```bash
python -m http.server 5510
```

Apoi deschide `http://localhost:5510/` (v1) sau `http://localhost:5510/v2/` (v2).

## Structură

- `assets/js/products.js` — produse, prețuri și date de contact (comune pentru v1 și v2)
- `assets/js/app.js` — v1: header/footer, coș, magazin, pagina de produs, comandă
- `assets/css/style.css` — stiluri v1
- `v2/v2.js`, `v2/v2.css` — v2: animații și coș
- `assets/img/`, `assets/video/` — poze și video-uri optimizate pentru web

## Stadiu

Demo front-end: coșul se păstrează în `localStorage`, iar comanda **nu** se trimite nicăieri. Pentru varianta live e nevoie de un backend (WooCommerce / Shopify / API propriu), un procesator de plăți cu cardul și integrarea cu un curier. Prețurile sunt orientative.
