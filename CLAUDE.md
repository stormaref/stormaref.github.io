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

- **`index.html`** — home: hero and the "What's here" hub cards.
- **`about/index.html`** — the resume (there is no PDF): experience, education, publications, projects, references carousel, contact dialog, success overlay.
- **`papers/`, `books/`, `blog/`** — list pages (paper cards with a hashtag filter, books with covers in `assets/covers/`, blog post cards).
- **`assets/css/site.css`** — all styles, built around CSS custom properties defined in `:root`. Layout uses `--page-width` (68rem) constrained by `.page` wrappers. Responsive breakpoints are inline `@media` blocks.
- **`assets/js/site.js`** — vanilla ES5 IIFE. Handles: mobile nav toggle, header scroll shadow, smooth scroll, IntersectionObserver-based active nav highlighting, section fade-in animation, contact `<dialog>`, success overlay (triggered by `?success` param), the references carousel, and the hero portrait intro.
- **`404.html`** — error page using the shared header and footer.
- **`tax/index.html`** — standalone tax calculation utility, independent from the main site.

## Key Interactions

**Contact form**: POSTs to Formspree (`formspree.io/f/moqzdkbk`). On success, Formspree redirects to `/?success`, which the JS detects to show the success overlay.

**References carousel**: The `[data-references-carousel]` container drives a CSS `transform: translate3d` carousel. Supports mouse prev/next buttons, keyboard arrows, touch swipe (48px threshold), and dot navigation. All slides are `.reference` blockquotes inside `.references-carousel__track`. Adding a new testimonial means adding a new `<blockquote class="reference">` — the JS auto-assigns IDs and builds dots dynamically.

**Navigation**: The header is two-tier. The top row (wordmark, Home/Papers/Books/Blog/About, theme toggle, Email) is identical on every page; the active link has `class="is-active" aria-current="page"`. Below 768px the links move into the hamburger menu. On `/about/` only (`<body class="has-subnav">`), a `.subnav` row inside the header holds the section pills and stays visible on phones as a horizontal scroller.

**Active section**: Uses `IntersectionObserver` on each `<section id="...">` and matches against the `.subnav a[data-section]` pills. The `rootMargin: "-35% 0px -45% 0px"` excludes the top/bottom thirds so the active section is the one occupying the middle viewport band.

**Portrait intro**: On pages with a `.hero__photo` (home and `/about/`), a second inline head script adds `gen-photo` to `<html>` unless reduced motion is set, which keeps the `<img>` hidden. `runPhotoGeneration` in `site.js` then overlays a canvas that "denoises" the photo out of noise over 40 steps, like a diffusion sampler, then swaps the real `<img>` back in. If `site.js` never takes over, a CSS fallback fades the photo in after 4.5s. A new page with the portrait needs that head line too.

**Section animations**: `.section` elements gain `.is-visible` when they intersect at 8% threshold; CSS transitions on that class drive the fade-in. Skipped entirely when `prefers-reduced-motion` is set.

## Content Conventions

- Experience and education use `<ol class="timeline">` with `<li class="timeline__item">` containing an `<article class="timeline__content">`.
- Publications use `<ul class="entries">` / `<li class="entries__item">`.
- Projects use `<ul class="project-grid">` with `<a class="project-card">` links.
- All external links use `target="_blank" rel="noopener noreferrer"`.
- SVG icons are inline (no icon library).
- `&ndash;` for date ranges, `&mdash;` for em-dashes, `&amp;` for ampersands — HTML entities throughout.
