(function () {
  "use strict";

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
    navToggle.addEventListener("click", function () {
      setNavOpen(!siteNav.classList.contains("is-open"));
    });
    siteNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setNavOpen(false);
      });
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
      history.replaceState(null, "", id);
    });
  });

  var navLinks = document.querySelectorAll(".site-nav__links a[data-section]");
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
            link.classList.toggle(
              "is-active",
              activeId === link.getAttribute("data-section")
            );
          });
        },
        { rootMargin: "-35% 0px -45% 0px", threshold: [0, 0.1, 0.25, 0.5] }
      );
      tracked.forEach(function (section) {
        navObserver.observe(section);
      });
    }
  }

  var sectionEls = document.querySelectorAll(".section");
  if (sectionEls.length) {
    if (!reducedMotion && "IntersectionObserver" in window) {
      var sectionObserver = new IntersectionObserver(
        function (entries, obs) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08 }
      );
      sectionEls.forEach(function (el) {
        sectionObserver.observe(el);
      });
    } else {
      sectionEls.forEach(function (el) {
        el.classList.add("is-visible");
      });
    }
  }

  var dialog = document.getElementById("contact-dialog");
  if (dialog) {
    document.querySelectorAll("[data-open-contact]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
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
  if (successOverlay) {
    function hideSuccess() {
      successOverlay.hidden = true;
      document.body.style.overflow = "";
      var url = new URL(window.location.href);
      url.searchParams.delete("success");
      history.replaceState(null, "", url.pathname + url.hash);
    }

    document.querySelectorAll("[data-hide-success]").forEach(function (btn) {
      btn.addEventListener("click", hideSuccess);
    });
    successOverlay.addEventListener("click", function (e) {
      if (e.target === successOverlay) hideSuccess();
    });

    if (new URLSearchParams(window.location.search).has("success")) {
      successOverlay.hidden = false;
      document.body.style.overflow = "hidden";
    }
  }

  var referencesCarousel = document.querySelector("[data-references-carousel]");
  if (referencesCarousel) {
    var referencesSection = document.getElementById("references");
    var scrollZone = referencesSection
      ? referencesSection.querySelector("[data-references-scroll-zone]")
      : null;
    var carouselViewport = referencesCarousel.querySelector(
      ".references-carousel__viewport"
    );
    var carouselTrack = referencesCarousel.querySelector(
      ".references-carousel__track"
    );
    var scrollHint = referencesCarousel.querySelector(
      ".references-carousel__hint"
    );
    var refCurrent = referencesCarousel.querySelector("[data-ref-current]");
    var refTotal = referencesCarousel.querySelector("[data-ref-total]");
    var refDots = referencesCarousel.querySelector("[data-ref-dots]");
    var slides = referencesCarousel.querySelectorAll(".reference");
    var STACK_DURATION = 360;
    var STACK_PEEK = 28;

    if (reducedMotion) {
      referencesCarousel.classList.add("references-carousel--reduced");
    }

    function measureSlideHeights() {
      var maxHeight = 0;
      slides.forEach(function (slide) {
        slide.classList.add("reference--measure");
        maxHeight = Math.max(maxHeight, slide.offsetHeight);
        slide.classList.remove("reference--measure");
      });
      if (maxHeight > 0 && carouselViewport && carouselTrack) {
        var stackHeight = maxHeight + STACK_PEEK;
        carouselViewport.style.minHeight = stackHeight + "px";
        carouselTrack.style.minHeight = stackHeight + "px";
      }
    }

    function buildDots() {
      if (!refDots) return;
      refDots.innerHTML = "";
      slides.forEach(function (_, index) {
        var dot = document.createElement("span");
        dot.className = "references-carousel__dot";
        dot.setAttribute("aria-hidden", "true");
        if (index === 0) dot.classList.add("is-active");
        refDots.appendChild(dot);
      });
    }

    buildDots();

    if (refTotal) refTotal.textContent = String(slides.length);

    measureSlideHeights();

    slides.forEach(function (slide, index) {
      if (!slide.id) slide.id = "reference-" + (index + 1);
    });

    if (slides.length <= 1) {
      if (scrollHint) scrollHint.hidden = true;
      return;
    }

    var currentIndex = 0;
    var isAnimating = false;
    var scrollStep = 0;

    function updateAria(index) {
      if (!carouselViewport) return;
      var slide = slides[index];
      var author = slide.querySelector(".reference__author");
      var label = author
        ? author.textContent.trim()
        : "Reference " + (index + 1);
      carouselViewport.setAttribute(
        "aria-label",
        "References, " + label + ", " + (index + 1) + " of " + slides.length
      );
    }

    function updateHint(index) {
      if (!scrollHint) return;
      if (index >= slides.length - 1) {
        scrollHint.classList.add("is-hidden");
      } else {
        scrollHint.classList.remove("is-hidden");
      }
    }

    function updateProgress(index) {
      if (refCurrent) refCurrent.textContent = String(index + 1);
      if (refDots) {
        refDots.querySelectorAll(".references-carousel__dot").forEach(function (dot, i) {
          dot.classList.toggle("is-active", i === index);
        });
      }
    }

    function applyStackLayout(index) {
      slides.forEach(function (slide, i) {
        slide.classList.remove(
          "is-active",
          "is-stacked",
          "is-past",
          "is-peeling",
          "is-promoting",
          "is-returning"
        );
        slide.removeAttribute("data-stack");

        var diff = i - index;
        if (diff === 0) {
          slide.classList.add("is-active");
        } else if (diff > 0 && diff <= 2) {
          slide.classList.add("is-stacked");
          slide.setAttribute("data-stack", String(diff));
        } else if (diff < 0) {
          slide.classList.add("is-past");
        }
      });
    }

    function finishTransition(index) {
      applyStackLayout(index);
      currentIndex = index;
      isAnimating = false;
      updateAria(index);
      updateHint(index);
      updateProgress(index);
    }

    function goTo(index) {
      if (index < 0 || index >= slides.length || index === currentIndex) {
        return;
      }
      if (isAnimating) return;

      var current = slides[currentIndex];
      var target = slides[index];
      var direction = index > currentIndex ? 1 : -1;

      if (reducedMotion) {
        finishTransition(index);
        return;
      }

      isAnimating = true;

      if (direction > 0) {
        current.classList.remove("is-active", "is-stacked");
        current.removeAttribute("data-stack");
        current.classList.add("is-peeling");

        target.classList.remove("is-stacked", "is-past");
        target.removeAttribute("data-stack");
        target.classList.add("is-promoting");

        slides.forEach(function (slide, i) {
          if (i === currentIndex || i === index) return;
          slide.classList.remove(
            "is-active",
            "is-stacked",
            "is-past",
            "is-peeling",
            "is-promoting",
            "is-returning"
          );
          slide.removeAttribute("data-stack");
          var diff = i - index;
          if (diff > 0 && diff <= 2) {
            slide.classList.add("is-stacked");
            slide.setAttribute("data-stack", String(diff));
          } else if (diff < 0) {
            slide.classList.add("is-past");
          }
        });

        requestAnimationFrame(function () {
          target.classList.add("is-active");
        });
      } else {
        current.classList.remove("is-active");
        current.classList.add("is-stacked");
        current.setAttribute("data-stack", "1");

        target.classList.remove("is-past");
        target.classList.add("is-returning");

        requestAnimationFrame(function () {
          target.classList.add("is-active");
        });
      }

      window.setTimeout(function () {
        finishTransition(index);
      }, STACK_DURATION);
    }

    function setScrollZoneHeight() {
      if (!scrollZone) return;
      scrollStep = Math.max(window.innerHeight * 0.65, 420);
      scrollZone.style.height =
        scrollStep * (slides.length - 1) +
        Math.max(window.innerHeight, scrollStep) +
        "px";
    }

    function indexFromScroll() {
      if (!scrollZone) return 0;
      var zoneTop =
        scrollZone.getBoundingClientRect().top + window.pageYOffset;
      var maxScroll = scrollZone.offsetHeight - window.innerHeight;
      if (maxScroll <= 0) return 0;
      var progress = (window.pageYOffset - zoneTop) / maxScroll;
      progress = Math.max(0, Math.min(1, progress));
      return Math.round(progress * (slides.length - 1));
    }

    function onReferencesScroll() {
      var nextIndex = indexFromScroll();
      if (nextIndex !== currentIndex) goTo(nextIndex);
    }

    setScrollZoneHeight();
    applyStackLayout(0);
    updateAria(0);
    updateHint(0);
    updateProgress(0);
    onReferencesScroll();

    window.addEventListener("scroll", onReferencesScroll, { passive: true });
    window.addEventListener("resize", function () {
      measureSlideHeights();
      setScrollZoneHeight();
      onReferencesScroll();
    });

    if (carouselViewport) {
      carouselViewport.addEventListener("keydown", function (e) {
        if (
          e.key !== "ArrowDown" &&
          e.key !== "ArrowUp" &&
          e.key !== "ArrowLeft" &&
          e.key !== "ArrowRight"
        ) {
          return;
        }
        e.preventDefault();
        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
          goTo(currentIndex + 1);
        } else {
          goTo(currentIndex - 1);
        }
      });
    }
  }

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (siteNav && siteNav.classList.contains("is-open")) setNavOpen(false);
    if (dialog && dialog.open) dialog.close();
  });
})();
