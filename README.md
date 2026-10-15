# Livada lu' Gavril — propunere site + magazin online

Propunere de site pentru Livada Lu Gavril S.R.L. (Leucușești, jud. Suceava): suc natural de mere și mere cu aronia, la sticlă și Bag-in-Box 3 L, plus dulceață fără zahăr.

Două versiuni, cu același magazin și același coș de cumpărături:

| Pagină | Descriere |
|---|---|
| `index.html` | **Pagina principală** (v2, cinematică): „Un an într-un pahar”, poveste la scroll cu GSAP + ScrollTrigger + SplitText + Lenis |
| `clasic.html` | Prima pagină din versiunea clasică (v1) |
| `magazin.html`, `produs.html?id=…`, `cos.html` | Magazinul, pagina de produs și coșul/comanda (comune pentru ambele versiuni) |
| `v2/` | Stilurile și scriptul paginii principale; `v2/index.html` redirecționează vechiul link spre pagina principală |

## Rulare locală

Site static, fără build. Orice server static din rădăcina proiectului:

```bash
python -m http.server 5510
```

Apoi deschide `http://localhost:5510/` (pagina principală) sau `http://localhost:5510/clasic.html` (versiunea clasică).

## Structură

- `assets/js/products.js` — produse, prețuri și date de contact (comune pentru v1 și v2)
- `assets/js/app.js` — versiunea clasică și magazinul: header/footer, coș, pagina de produs, comandă
- `assets/css/style.css` — stiluri v1
- `v2/v2.js`, `v2/v2.css` — pagina principală: animații și coș
- `assets/img/`, `assets/video/` — poze și video-uri optimizate pentru web

## Stadiu

Demo front-end: coșul se păstrează în `localStorage`, iar comanda **nu** se trimite nicăieri. Pentru varianta live e nevoie de un backend (WooCommerce / Shopify / API propriu), un procesator de plăți cu cardul și integrarea cu un curier. Prețurile sunt orientative.
