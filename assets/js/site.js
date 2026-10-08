(function () {
  "use strict";

  // Theme toggle
  var themeToggle = document.getElementById("theme-toggle");
  // The inline head script already resolved the theme (saved choice, else the OS preference).
  var isDark = document.documentElement.getAttribute("data-theme") === "dark";

  var themeColorMeta = document.querySelector('meta[name="theme-color"]');

  function applyTheme(dark) {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    if (themeColorMeta) {
      themeColorMeta.setAttribute("content", dark ? "#09090b" : "#fafafa");
    }
    if (themeToggle) {
      themeToggle.setAttribute(
        "aria-label",
        dark ? "Switch to light mode" : "Switch to dark mode"
      );
    }
  }

  applyTheme(isDark);

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      isDark = !isDark;
      try {
        localStorage.setItem("theme", isDark ? "dark" : "light");
      } catch (e) {}
      applyTheme(isDark);
    });
  }

  var reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  var navToggle = document.getElementById("nav-toggle");
  var siteNav = document.getElementById("site-nav");

  function setNavOpen(open) {
    if (!siteNav || !navToggle) return;
    siteNav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  if (navToggle && siteNav) {
    var mobileNav = window.matchMedia("(max-width: 768px)");

    navToggle.addEventListener("click", function () {
      setNavOpen(!siteNav.classList.contains("is-open"));
    });
    siteNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setNavOpen(false);
      });
    });
    document.addEventListener("pointerdown", function (e) {
      if (!mobileNav.matches || !siteNav.classList.contains("is-open")) return;
      if (siteNav.contains(e.target) || navToggle.contains(e.target)) return;
      setNavOpen(false);
    });
  }

  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      var id = anchor.getAttribute("href");
      if (!id || id === "#") return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "start",
      });
      // Move keyboard focus with the scroll so the next Tab continues from the target.
      if (!target.hasAttribute("tabindex")) {
        target.setAttribute("tabindex", "-1");
      }
      target.focus({ preventScroll: true });
      history.replaceState(null, "", id);
    });
  });

  var navLinks = document.querySelectorAll(".subnav a[data-section]");
  var subnavList = document.querySelector(".subnav__links");

  // Keep the active pill visible when the sub-nav scrolls horizontally (phones).
  function revealInSubnav(link) {
    if (!subnavList || subnavList.scrollWidth <= subnavList.clientWidth) return;
    var target =
      link.offsetLeft - (subnavList.clientWidth - link.offsetWidth) / 2;
    subnavList.scrollTo({
      left: target,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }
  if (navLinks.length && "IntersectionObserver" in window) {
    var tracked = [];
    navLinks.forEach(function (link) {
      var section = document.getElementById(link.getAttribute("data-section"));
      if (section) tracked.push(section);
    });

    if (tracked.length) {
      var visible = new Map();
      var navObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              visible.set(entry.target.id, entry.intersectionRatio);
            } else {
              visible.delete(entry.target.id);
            }
          });

          var activeId = null;
          var bestRatio = 0;
          visible.forEach(function (ratio, id) {
            if (ratio >= bestRatio) {
              bestRatio = ratio;
              activeId = id;
            }
          });

          if (!activeId) {
            var scrollY = window.scrollY + window.innerHeight * 0.35;
            for (var i = tracked.length - 1; i >= 0; i--) {
              if (tracked[i].offsetTop <= scrollY) {
                activeId = tracked[i].id;
                break;
              }
            }
          }

          navLinks.forEach(function (link) {
            var isActive = activeId === link.getAttribute("data-section");
            if (isActive && !link.classList.contains("is-active")) {
              revealInSubnav(link);
            }
            link.classList.toggle("is-active", isActive);
            if (isActive) {
              link.setAttribute("aria-current", "location");
            } else {
              link.removeAttribute("aria-current");
            }
          });
        },
        { rootMargin: "-35% 0px -45% 0px", threshold: [0, 0.1, 0.25, 0.5] }
      );
      tracked.forEach(function (section) {
        navObserver.observe(section);
      });
    }
  }

  // Sections that start below the fold fade in when scrolled to. Sections
  // already on screen are left alone so nothing visible blinks out.
  var sectionEls = document.querySelectorAll(".section");
  if (sectionEls.length && !reducedMotion && "IntersectionObserver" in window) {
    var sectionObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.remove("is-pending");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    sectionEls.forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight) return;
      el.classList.add("reveal", "is-pending");
      sectionObserver.observe(el);
    });
  }

  // Hero portrait intro: the photo is denoised out of noise like a diffusion
  // sampler. The head script on pages with a portrait adds .gen-photo to
  // <html> (hiding the <img>) unless reduced motion is set or the intro
  // already played this session. Clicking the portrait replays it.
  var genFigure = document.querySelector(".hero__photo");
  var genImg = genFigure && genFigure.querySelector("img");
  if (genImg && !reducedMotion) {
    runPhotoGeneration(
      genFigure,
      genImg,
      document.documentElement.classList.contains("gen-photo")
    );
  }

  var noise404 = document.querySelector("[data-noise-404]");
  if (noise404) {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        runNoise404(noise404);
      });
    } else {
      runNoise404(noise404);
    }
  }

  var tagFilter = document.querySelector("[data-tag-filter]");
  var tagFilterList = document.querySelector("[data-tag-filter-list]");
  if (tagFilter && tagFilterList) {
    var tagButtons = tagFilter.querySelectorAll("[data-tag]");
    var tagItems = tagFilterList.querySelectorAll("li[data-tags]");
    var tagCount = document.querySelector("[data-tag-filter-count]");

    tagButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        var tag = button.getAttribute("data-tag");

        tagButtons.forEach(function (b) {
          var active = b === button;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-pressed", active ? "true" : "false");
        });

        var shown = 0;
        tagItems.forEach(function (item) {
          var tags = (item.getAttribute("data-tags") || "").split(" ");
          item.hidden = tag !== "all" && tags.indexOf(tag) === -1;
          if (!item.hidden) shown++;
        });

        if (tagCount) {
          var total = tagItems.length;
          tagCount.textContent =
            tag === "all"
              ? "Showing all " + total + " papers"
              : "Showing " + shown + " of " + total + " papers \u00b7 " +
                button.firstChild.textContent.trim();
        }
      });
    });
  }

  var dialog = document.getElementById("contact-dialog");
  if (dialog) {
    document.querySelectorAll("[data-open-contact]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        if (typeof dialog.showModal === "function") dialog.showModal();
      });
    });
    document.querySelectorAll("[data-close-contact]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        dialog.close();
      });
    });
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog) dialog.close();
    });
  }

  var successOverlay = document.getElementById("success-overlay");
  var hideSuccess = null;
  if (successOverlay) {
    // Everything except the overlay is made inert while it is open, so it behaves as a modal.
    var successBackground = Array.prototype.filter.call(
      document.body.children,
      function (el) {
        return el !== successOverlay && el.tagName !== "SCRIPT";
      }
    );

    hideSuccess = function () {
      if (successOverlay.hidden) return;
      successOverlay.hidden = true;
      document.body.style.overflow = "";
      successBackground.forEach(function (el) {
        el.inert = false;
      });
      var url = new URL(window.location.href);
      url.searchParams.delete("success");
      history.replaceState(null, "", url.pathname + url.hash);
      var main = document.getElementById("main");
      if (main) {
        if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
        main.focus({ preventScroll: true });
      }
    };

    document.querySelectorAll("[data-hide-success]").forEach(function (btn) {
      btn.addEventListener("click", hideSuccess);
    });
    successOverlay.addEventListener("click", function (e) {
      if (e.target === successOverlay) hideSuccess();
    });

    if (new URLSearchParams(window.location.search).has("success")) {
      successOverlay.hidden = false;
      document.body.style.overflow = "hidden";
      successBackground.forEach(function (el) {
        el.inert = true;
      });
      var successButton = successOverlay.querySelector("[data-hide-success]");
      if (successButton) successButton.focus();
    }
  }

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (siteNav && siteNav.classList.contains("is-open")) setNavOpen(false);
    if (dialog && dialog.open) dialog.close();
    if (hideSuccess) hideSuccess();
  });

  function runPhotoGeneration(figure, img, autoplay) {
    var root = document.documentElement;
    var STEPS = 40;
    var STEP_MS = 50;
    // After this the CSS fallback in site.css has already faded the photo in.
    var LATE_MS = 3500;
    var running = false;

    function showPhoto() {
      root.classList.remove("gen-photo");
      figure.classList.remove("is-generating");
    }

    function play() {
      if (running) return;
      running = true;
      try {
        animate();
      } catch (e) {
        // e.g. a tainted canvas: skip the intro.
        running = false;
        showPhoto();
      }
    }

    // Calls back once the photo has loaded and is at least half on screen, so
    // the intro doesn't play out below the fold.
    function whenLoadedAndVisible(callback) {
      var loaded = img.complete && img.naturalWidth > 0;
      var visible = !("IntersectionObserver" in window);
      function check() {
        if (loaded && visible) callback();
      }
      if (!loaded) {
        if (img.complete) return showPhoto();
        img.addEventListener("load", function () {
          loaded = true;
          check();
        });
        img.addEventListener("error", showPhoto);
      }
      if (!visible) {
        var observer = new IntersectionObserver(
          function (entries) {
            if (!entries[0].isIntersecting) return;
            observer.disconnect();
            visible = true;
            check();
          },
          { threshold: 0.5 }
        );
        observer.observe(figure);
      }
      check();
    }

    if (autoplay) {
      if (performance.now() > LATE_MS) {
        showPhoto();
      } else {
        // Hide the photo (and cancel the CSS fallback) until the intro starts.
        figure.classList.add("is-generating");
        whenLoadedAndVisible(function () {
          try {
            sessionStorage.setItem("gen-photo", "1");
          } catch (e) {}
          play();
        });
      }
    }

    figure.classList.add("can-replay");
    figure.title = "Click to replay";
    figure.addEventListener("click", function () {
      if (img.complete && img.naturalWidth) play();
    });

    function animate() {
      var box = img.getBoundingClientRect();
      if (!box.width || !box.height) return showPhoto();
      var dpr = window.devicePixelRatio || 1;
      // Capped at the largest portrait asset (me-576.jpg).
      var W = Math.max(64, Math.min(Math.round(box.width * dpr), 576));
      var H = Math.max(64, Math.round((W * box.height) / box.width));
      var N = W * H;

      var canvas = document.createElement("canvas");
      canvas.className = "hero__photo-gen";
      canvas.width = W;
      canvas.height = H;
      canvas.setAttribute("aria-hidden", "true");
      var ctx = canvas.getContext("2d");

      // Same crop as object-fit: cover. This scales the whole image rather than
      // using a source rect: for a srcset image Chrome reports naturalWidth in
      // CSS pixels but reads source rects in bitmap pixels.
      var scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      var dw = img.naturalWidth * scale;
      var dh = img.naturalHeight * scale;
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
      var src = ctx.getImageData(0, 0, W, H).data;

      var paper = cssColor(ctx, getComputedStyle(figure).backgroundColor);

      var R = new Float32Array(N);
      var G = new Float32Array(N);
      var B = new Float32Array(N);
      var tmp = new Float32Array(N);
      var i, j;
      for (i = 0, j = 0; i < N; i++, j += 4) {
        R[i] = src[j] / 255;
        G[i] = src[j + 1] / 255;
        B[i] = src[j + 2] / 255;
      }

      // Noise in grains of about one CSS pixel, sampled at a random offset
      // each step so every step gets fresh noise.
      var grain = Math.max(1, Math.round(W / box.width));
      var gridW = Math.ceil(W / grain);
      var cell = new Int32Array(N);
      for (i = 0; i < N; i++) {
        cell[i] = Math.floor(Math.floor(i / W) / grain) * gridW + Math.floor((i % W) / grain);
      }
      var NOISE_PAD = 4096;
      var noise = new Float32Array(gridW * Math.ceil(H / grain) + NOISE_PAD);
      for (i = 0; i < noise.length; i++) {
        noise[i] = (Math.random() + Math.random() - 1) * 2.45;
      }

      var blurR = new Float32Array(N);
      var blurG = new Float32Array(N);
      var blurB = new Float32Array(N);
      var frame = ctx.createImageData(W, H);
      var px = frame.data;

      // One sampler step at progress p in (0, 1]: a blurred estimate of the
      // photo rises out of the background colour while the noise fades.
      // p = 1 draws the photo exactly.
      function drawStep(p) {
        // Eased so the noise lingers and the photo only sharpens near the end.
        var q = p * p;
        var alphaBar = Math.sin((q * Math.PI) / 2);
        alphaBar *= alphaBar;
        var signal = Math.sqrt(alphaBar);
        var sigma = Math.sqrt(1 - alphaBar) * 0.3;
        var radius = Math.round((W / 20) * (1 - q) * (1 - q));
        var r = R;
        var g = G;
        var b = B;
        if (radius > 0) {
          blurR.set(R);
          blurG.set(G);
          blurB.set(B);
          boxBlur(blurR, tmp, W, H, radius);
          boxBlur(blurG, tmp, W, H, radius);
          boxBlur(blurB, tmp, W, H, radius);
          r = blurR;
          g = blurG;
          b = blurB;
        }
        // Mostly shared (luminance) noise with a little per-channel colour.
        var oL = Math.floor(Math.random() * NOISE_PAD);
        var oR = Math.floor(Math.random() * NOISE_PAD);
        var oG = Math.floor(Math.random() * NOISE_PAD);
        var oB = Math.floor(Math.random() * NOISE_PAD);
        for (var i = 0, j = 0; i < N; i++, j += 4) {
          var c = cell[i];
          var nl = 0.95 * noise[c + oL];
          px[j] = (paper[0] + (r[i] - paper[0]) * signal + sigma * (nl + 0.3 * noise[c + oR])) * 255;
          px[j + 1] = (paper[1] + (g[i] - paper[1]) * signal + sigma * (nl + 0.3 * noise[c + oG])) * 255;
          px[j + 2] = (paper[2] + (b[i] - paper[2]) * signal + sigma * (nl + 0.3 * noise[c + oB])) * 255;
          px[j + 3] = 255;
        }
        ctx.putImageData(frame, 0, 0);
      }

      var status = document.createElement("span");
      status.className = "hero__photo-status";
      status.setAttribute("aria-hidden", "true");

      function showStep(step) {
        drawStep((step + 1) / STEPS);
        var n = String(step + 1);
        status.textContent = "denoising " + (n.length < 2 ? "0" + n : n) + "/" + STEPS;
      }

      showStep(0);
      figure.appendChild(canvas);
      figure.appendChild(status);
      figure.classList.add("is-generating");

      var startTime = null;
      var lastStep = 0;

      function tick(now) {
        if (startTime === null) startTime = now;
        var step = Math.min(STEPS - 1, Math.floor((now - startTime) / STEP_MS));
        if (step !== lastStep) {
          lastStep = step;
          showStep(step);
        }
        if (step === STEPS - 1) {
          // The canvas now matches the photo, so swap the <img> in under it.
          showPhoto();
          figure.classList.add("is-generated");
          setTimeout(function () {
            figure.removeChild(canvas);
            figure.removeChild(status);
            figure.classList.remove("is-generated");
            running = false;
          }, 600);
          return;
        }
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
  }

  // The 404 code drawn as text half-buried in animated noise.
  function runNoise404(el) {
    var box = el.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = Math.round(box.width * dpr);
    var H = Math.round(box.height * dpr);
    if (!W || !H) return;

    var canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    canvas.setAttribute("aria-hidden", "true");
    var ctx = canvas.getContext("2d");
    var style = getComputedStyle(el);
    ctx.font =
      style.fontWeight + " " + parseFloat(style.fontSize) * dpr + "px " + style.fontFamily;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#000";
    ctx.fillText(el.textContent.trim(), W / 2, H / 2);
    var glyphs = ctx.getImageData(0, 0, W, H).data;

    // Ink per pixel, and opacity: the glyphs plus a noise field that fades
    // out towards the edges in an oval, so the canvas has no visible box.
    var N = W * H;
    var ink = new Float32Array(N);
    var alpha = new Float32Array(N);
    for (var i = 0; i < N; i++) {
      var dx = ((i % W) - W / 2) / (W / 2);
      var dy = (Math.floor(i / W) - H / 2) / (H / 2);
      var field = Math.max(0, Math.min(1, (1 - Math.sqrt(dx * dx + dy * dy)) * 1.6));
      var coverage = glyphs[i * 4 + 3] / 255;
      ink[i] = coverage * 0.85;
      alpha[i] = Math.max(coverage, 0.5 * field);
    }
    var grain = Math.max(1, Math.round(dpr * 2));
    var gridW = Math.ceil(W / grain);
    var cell = new Int32Array(N);
    for (i = 0; i < N; i++) {
      cell[i] = Math.floor(Math.floor(i / W) / grain) * gridW + Math.floor((i % W) / grain);
    }
    var NOISE_PAD = 4096;
    var noise = new Float32Array(gridW * Math.ceil(H / grain) + NOISE_PAD);
    for (i = 0; i < noise.length; i++) {
      noise[i] = (Math.random() + Math.random() - 1) * 2.45;
    }
    var frame = ctx.createImageData(W, H);
    var px = frame.data;

    el.appendChild(canvas);
    el.classList.add("has-noise");

    function draw() {
      // Colours are re-read each frame so the theme toggle applies.
      var fg = cssColor(ctx, getComputedStyle(el.parentNode).color);
      var bg = cssColor(ctx, getComputedStyle(document.body).backgroundColor);
      var o = Math.floor(Math.random() * NOISE_PAD);
      for (var i = 0, j = 0; i < N; i++, j += 4) {
        var a = ink[i];
        var n = 0.16 * noise[cell[i] + o];
        px[j] = (bg[0] + (fg[0] - bg[0]) * a + n) * 255;
        px[j + 1] = (bg[1] + (fg[1] - bg[1]) * a + n) * 255;
        px[j + 2] = (bg[2] + (fg[2] - bg[2]) * a + n) * 255;
        px[j + 3] = 255 * alpha[i];
      }
      ctx.putImageData(frame, 0, 0);
    }

    draw();
    if (reducedMotion) return;
    var last = 0;
    requestAnimationFrame(function tick(now) {
      if (now - last > 90) {
        last = now;
        draw();
      }
      requestAnimationFrame(tick);
    });
  }

  // A CSS colour as [r, g, b] in 0..1, normalised through the canvas parser.
  function cssColor(ctx, value) {
    ctx.fillStyle = "#000";
    ctx.fillStyle = value;
    var n = parseInt(String(ctx.fillStyle).slice(1), 16) || 0;
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  // In-place box blur of a w*h plane; tmp is scratch space of the same size.
  function boxBlur(data, tmp, w, h, r) {
    blurLines(data, tmp, w, h, r, 1, w);
    blurLines(tmp, data, h, w, r, w, 1);
  }

  // Running-sum blur along `count` lines of `len` samples, `step` apart within
  // a line, with consecutive lines starting `stride` apart. Edges are clamped.
  function blurLines(src, dst, len, count, r, step, stride) {
    var norm = 1 / (2 * r + 1);
    var last = len - 1;
    for (var l = 0; l < count; l++) {
      var base = l * stride;
      var sum = 0;
      for (var k = -r; k <= r; k++) {
        sum += src[base + Math.min(last, Math.max(0, k)) * step];
      }
      for (var x = 0; x < len; x++) {
        dst[base + x * step] = sum * norm;
        sum +=
          src[base + Math.min(last, x + r + 1) * step] -
          src[base + Math.max(0, x - r) * step];
      }
    }
  }
})();
