# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Local Development

No build step or package manager. Serve locally with any static HTTP server:

```bash
python3 -m http.server 8080
# or
npx serve .
# or via Jekyll (matches GitHub Pages):
bundle exec jekyll serve
```

The site deploys automatically on push to `main` via GitHub Pages. The `_config.yml` sets `theme: jekyll-theme-minimal` but the actual layout is fully custom — Jekyll is only used as the Pages build runner.

## Architecture

This is a **small multi-page static portfolio** — no framework, no bundler, no dependencies beyond Google Fonts. Every page repeats the same `<head>` theme script, header and footer markup inline, so header/nav changes must be made on all of them.

- **`index.html`** — home: hero, the "Now" strip, and "Selected work" cards.
- **`about/index.html`** — the resume (there is no PDF): experience, education, publications, projects, stacked references, contact dialog, success overlay.
- **`research/index.html`** — research summary and publications. The publication list is duplicated on `/about/#publications`; keep both in sync.
- **`books/`, `papers/`** — the two tabs of "Reading", Books first and the default (books grouped into "Reading now" and "Finished", covers in `assets/covers/`; paper cards with a topic filter). Both pages share the same header and `.tabs` row; update the tab counts when adding items.
- **`blog/`** — "Writing": article cards.
- **`assets/css/site.css`** — all styles, built around CSS custom properties defined in `:root`. Layout uses `--page-width` (68rem) constrained by `.page` wrappers. Responsive breakpoints are inline `@media` blocks.
- **`assets/js/site.js`** — vanilla ES5 IIFE. Handles: mobile nav toggle, header scroll shadow, smooth scroll, IntersectionObserver-based active nav highlighting, section fade-in animation, contact `<dialog>`, success overlay (triggered by `?success` param), the papers topic filter, the hero portrait intro, and the 404 noise effect.
- **`404.html`** — "Lost in the noise" error page; `site.js` redraws the `[data-noise-404]` code as text in animated noise.
- **`tax/index.html`** — standalone tax calculation utility, independent from the main site.

## Key Interactions

**Contact form**: POSTs to Formspree (`formspree.io/f/moqzdkbk`). On success, Formspree redirects to `/?success`, which the JS detects to show the success overlay.

**References**: `.reference` blockquotes stacked in a `.references` grid (two columns from 900px). Each starts with a `.reference__lead` pull quote taken from its own text.

**Navigation**: `.site-header` is a transparent wrapper around frosted-glass capsules. The top bar (`.site-header__inner`: logo mark + name, Home/Research/Writing/Reading/About as a segmented pill control, theme toggle, Email) is identical on every page; the active link has `class="is-active" aria-current="page"` (on `/papers/`, "Reading" uses `aria-current="true"` since it links to `/books/`, the default Reading tab). Below 768px the links move into a dropdown under the bars, opened by the menu button on the right. On `/about/` only (`<body class="has-subnav">`), the `.subnav` section pills are a second, smaller capsule below the bar and scroll horizontally on phones. The footer (copyright plus Email/GitHub/Scholar/LinkedIn) is also repeated on every page.

**Favicon and logo mark**: Aref's signature, an infinity sign with a repeating-decimal bar above it (black ∞, blue bar, off-white tile), in `assets/icons/` (16/32 PNG, multi-size `favicon.ico`, 180 Apple touch icon, 192/512 Android). The header logo uses `android-chrome-192x192.png`. Icon `<link>`s carry a `?v=4` cache-buster; bump it on every page when the icons change.

**Section illustrations**: on Research, Writing (`/blog/`) and Reading (`/papers/`, `/books/`) the page header is a `.page-header` grid with a `.page-art` tile beside the title: an inline SVG animated purely with CSS keyframes (noisy labels getting corrected, lines writing themselves, a page turning). Animations are switched off under `prefers-reduced-motion`, so each SVG's un-animated state must look complete.

**Active section**: Uses `IntersectionObserver` on each `<section id="...">` and matches against the `.subnav a[data-section]` pills. The `rootMargin: "-35% 0px -45% 0px"` excludes the top/bottom thirds so the active section is the one occupying the middle viewport band.

**Portrait intro**: On pages with a `.hero__photo` (home and `/about/`), a second inline head script adds `gen-photo` to `<html>` unless reduced motion is set or the intro already played this session (`sessionStorage`), which keeps the `<img>` hidden. `runPhotoGeneration` in `site.js` waits until the photo is loaded and half on screen, overlays a canvas that "denoises" the photo out of noise over 40 steps, like a diffusion sampler, then swaps the real `<img>` back in. Clicking the portrait replays it. If `site.js` never takes over, a CSS fallback fades the photo in after 4.5s. A new page with the portrait needs that head line too.

**Section animations**: sections that start below the fold get `.reveal.is-pending` (hidden) and lose `.is-pending` when they intersect at 8% threshold, which transitions them in. Sections already on screen are never hidden. Skipped entirely when `prefers-reduced-motion` is set.

## Content Conventions

- Experience and education use `<ol class="timeline">` with `<li class="timeline__item">` containing an `<article class="timeline__content">`.
- Publications use `<ul class="entries">` / `<li class="entries__item">`.
- Projects use `<ul class="project-grid">` with `<a class="project-card">` links.
- All external links use `target="_blank" rel="noopener noreferrer"`.
- SVG icons are inline (no icon library).
- `&ndash;` for date ranges, `&mdash;` for em-dashes, `&amp;` for ampersands — HTML entities throughout.
