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

This is a **single-file portfolio site** — no framework, no bundler, no dependencies beyond Google Fonts.

- **`index.html`** — entire page content: hero, experience, education, publications, projects, references, contact dialog, success overlay. All sections live inline here.
- **`assets/css/site.css`** — all styles, built around CSS custom properties defined in `:root`. Layout uses `--page-width` (68rem) constrained by `.page` wrappers. Responsive breakpoints are inline `@media` blocks.
- **`assets/js/site.js`** — vanilla ES5 IIFE. Handles: mobile nav toggle, header scroll shadow, smooth scroll, IntersectionObserver-based active nav highlighting, section fade-in animation, contact `<dialog>`, success overlay (triggered by `?success` param), and the references carousel.
- **`404.html`** — custom error page, standalone.
- **`tax/index.html`** — standalone tax calculation utility, independent from the main site.

## Key Interactions

**Contact form**: POSTs to Formspree (`formspree.io/f/moqzdkbk`). On success, Formspree redirects to `/?success`, which the JS detects to show the success overlay.

**References carousel**: The `[data-references-carousel]` container drives a CSS `transform: translate3d` carousel. Supports mouse prev/next buttons, keyboard arrows, touch swipe (48px threshold), and dot navigation. All slides are `.reference` blockquotes inside `.references-carousel__track`. Adding a new testimonial means adding a new `<blockquote class="reference">` — the JS auto-assigns IDs and builds dots dynamically.

**Active nav**: Uses `IntersectionObserver` on each `<section id="...">` and matches against `<a data-section="...">` links. The `rootMargin: "-35% 0px -45% 0px"` excludes the top/bottom thirds so the active section is the one occupying the middle viewport band.

**Section animations**: `.section` elements gain `.is-visible` when they intersect at 8% threshold; CSS transitions on that class drive the fade-in. Skipped entirely when `prefers-reduced-motion` is set.

## Content Conventions

- Experience and education use `<ol class="timeline">` with `<li class="timeline__item">` containing an `<article class="timeline__content">`.
- Publications use `<ul class="entries">` / `<li class="entries__item">`.
- Projects use `<ul class="project-grid">` with `<a class="project-card">` links.
- All external links use `target="_blank" rel="noopener noreferrer"`.
- SVG icons are inline (no icon library).
- `&ndash;` for date ranges, `&mdash;` for em-dashes, `&amp;` for ampersands — HTML entities throughout.
