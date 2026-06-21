# KimVie — Lacquer Redesign · Design & Evaluation Notes

A redesign of the KimVie Vietnamese craft-village site, evaluated against **The $10K
Checklist** (8 criteria) and rebuilt in a committed art direction.

> Note on the brief: the checklist names **8** criteria, not 10 — "10K" is the price
> tag ($10,000), not a count. The evaluation below covers all 8.

---

## 1. Files

```
index.html      — markup, SVG sprite, all 7 in-page "pages" (SPA)
styles.css      — the lacquer design system (single source of styling)
script.js       — router, cart, heritage passport, product modal, filters, reveal
assets/
  dynamic_background.mp4   — full-page video ground
  poster.jpg               — video poster frame
```
Run any static server from this folder, e.g. `npx http-server . -p 5601`, then open
`http://localhost:5601`.

## 2. Three requested changes (done)

- **Full-page video** — the video is now a fixed ground behind the *entire* site
  (`.bg-stage`, `z-index:-1`), screen-blended over lacquer black so the landscape
  glows like mother-of-pearl, with a vignette veil that keeps text legible.
- **All sound removed** — the Web-Audio "tiếng nghề" engine, the per-gian *listen*
  buttons, and every UI sound are gone. No `AudioContext` anywhere.
- **AI + chat bubbles removed** — the floating "AI" assistant, its chat window, and
  the CSKH (💬) widget + panel are deleted, along with all their JS.

---

## 3. Evaluation vs. The $10K Checklist — before → after

| # | Criterion | Before | After | What changed |
|---|-----------|:------:|:-----:|--------------|
| 01 | Point of view, not a template | 4 | **9** | Committed to **Sơn mài / lacquer-luxe** — Vietnam's own luxury vocabulary (lacquer black, gold leaf, silk vermilion, mother-of-pearl) instead of the generic cream-serif-terracotta default. |
| 02 | Typography that does work | 6 | **8** | **Cormorant Garamond** (high-contrast display, italic accents) paired with **Be Vietnam Pro** (body, full Vietnamese diacritics). Dramatic scale: hero `clamp(46px,6.4vw,88px)`. Neither face is Inter/Roboto. |
| 03 | Restrained color system | 7 | **9** | Five tokens, used consistently: lacquer, gold, vermilion, jade, pearl. Premium through restraint. |
| 04 | Hierarchy that breathes | 5 | **8** | A clear hero thesis (the gilt arch), generous section rhythm (104px), a single accent color carrying emphasis, serif prices, larger type scale. |
| 05 | Imagery with intent | 3 | **6** | Per your choice, kept **illustration-only** but elevated: gold line-art on lacquer reads as intentional, not placeholder. (See limitations — real photography is the next jump.) |
| 06 | Motion that whispers | 5 | **8** | Replaced AOS-style fade-up with a *quiet* staggered hero entrance, an 8–10px scroll reveal that fires once, and hover micro-interactions only. `prefers-reduced-motion` fully respected (video pauses, reveals disabled). |
| 07 | Mobile that's designed, not shrunk | 3 | **8** | Real mobile decisions: a dedicated hamburger dropdown, the desktop-only gilt arch hidden, single-column grids, full-width CTAs, 16px base text, ≥44px touch targets. |
| 08 | The invisible expensive stuff | 5 | **8** | SVG icons (no emoji), WCAG-minded contrast on lacquer, visible keyboard focus rings, `aria-label` on icon-only buttons, semantic landmarks, external CSS/JS (cacheable), ~2.5MB video. |

## 4. Hidden biases named — and how they're handled

- **"Premium = beige serif" (Western luxury codes).** Replaced with Vietnam's lacquer
  palette. This is the core move of the redesign.
- **Decoration-as-wow.** Spinning drums and scattered motifs are dialed back to faint
  ambient layers; impact now comes from hierarchy and the one signature (the gilt arch).
- **Emoji-as-icon.** All nav, cart, and social emojis replaced with inline SVG.
- **Engaged-user bias (gamification).** The passport is kept (it's a genuine retention
  hook) but it's no longer the loudest element on the page.
- **Regional bias — still open.** The three featured villages (Bát Tràng, Vạn Phúc,
  Phú Vinh) are all Northern. This is a *content* bias the visual redesign can't fix
  alone — see limitations.

## 5. Design tokens

```
Lacquer ground   #15110D      Gold leaf      #C8A24B    Lit gold   #E2C57E
Raised panel     #1E1813      Silk vermilion #C8412E    Jade       #7E9A68
Text (pearl)     #F1E6C9      Muted          #B0A079    Hairline   rgba(200,162,75,.20)

Display  Cormorant Garamond (500/600/700, italic 500)
Body     Be Vietnam Pro (300–700)
```

## 6. Known limitations & recommended next steps

1. **Imagery (criterion 05).** You chose illustration-only, so this is the lowest score.
   The single biggest remaining upgrade is real artisan photography (the reference
   folder already has it) for hero, village, and product cards.
2. **Regional representation.** Add Central/South craft villages (e.g. Huế, Hội An,
   Mekong) to remove the Northern-only framing — a content task.
3. **One language.** Vietnamese-only excludes diaspora/tourist buyers; an EN toggle
   would widen the market.
4. **Video weight.** 2.5MB autoplays on load; consider a poster-first lazy load and a
   lighter/compressed encode for the sub-2s target on slow connections.
