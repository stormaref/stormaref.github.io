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
    var mobileNav = window.matchMedia("(max-width: 960px)");

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
    var carouselViewport = referencesCarousel.querySelector(
      ".references-carousel__viewport"
    );
    var carouselTrack = referencesCarousel.querySelector(
      ".references-carousel__track"
    );
    var refCurrent = referencesCarousel.querySelector("[data-ref-current]");
    var refTotal = referencesCarousel.querySelector("[data-ref-total]");
    var refDots = referencesCarousel.querySelector("[data-ref-dots]");
    var refPrev = referencesCarousel.querySelector("[data-ref-prev]");
    var refNext = referencesCarousel.querySelector("[data-ref-next]");
    var slides = referencesCarousel.querySelectorAll(".reference");
    var SWIPE_THRESHOLD = 48;

    if (reducedMotion) {
      referencesCarousel.classList.add("references-carousel--reduced");
    }

    function slideLabel(slide, index) {
      var author = slide.querySelector(".reference__author");
      return author ? author.textContent.trim() : "Reference " + (index + 1);
    }

    function buildDots() {
      if (!refDots) return;
      refDots.innerHTML = "";
      slides.forEach(function (slide, index) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "references-carousel__dot";
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-selected", index === 0 ? "true" : "false");
        dot.setAttribute("aria-controls", slide.id || "reference-" + (index + 1));
        dot.setAttribute("aria-label", "Go to reference from " + slideLabel(slide, index));
        if (index === 0) dot.classList.add("is-active");
        dot.addEventListener("click", function () {
          goTo(index);
        });
        refDots.appendChild(dot);
      });
    }

    buildDots();

    if (refTotal) refTotal.textContent = String(slides.length);

    slides.forEach(function (slide, index) {
      if (!slide.id) slide.id = "reference-" + (index + 1);
    });

    if (slides.length <= 1) {
      if (refPrev) refPrev.hidden = true;
      if (refNext) refNext.hidden = true;
      return;
    }

    var currentIndex = 0;
    var touchStartX = 0;
    var touchStartY = 0;
    var touchDeltaX = 0;
    var touchLocked = null;

    function updateAria(index) {
      if (!carouselViewport) return;
      carouselViewport.setAttribute(
        "aria-label",
        "References, " +
          slideLabel(slides[index], index) +
          ", " +
          (index + 1) +
          " of " +
          slides.length
      );
    }

    function updateProgress(index) {
      if (refCurrent) refCurrent.textContent = String(index + 1);
      if (refDots) {
        refDots.querySelectorAll(".references-carousel__dot").forEach(function (dot, i) {
          var isActive = i === index;
          dot.classList.toggle("is-active", isActive);
          dot.setAttribute("aria-selected", isActive ? "true" : "false");
        });
      }
    }

    function updateButtons(index) {
      if (refPrev) refPrev.disabled = index <= 0;
      if (refNext) refNext.disabled = index >= slides.length - 1;
    }

    function updateTrack(animate) {
      if (!carouselTrack || !carouselViewport) return;
      var slideWidth = carouselViewport.offsetWidth;
      var offset = -currentIndex * slideWidth;
      carouselTrack.style.transition =
        animate && !reducedMotion
          ? "transform 360ms cubic-bezier(0.22, 1, 0.36, 1)"
          : "none";
      carouselTrack.style.transform = "translate3d(" + offset + "px, 0, 0)";
    }

    function goTo(index, animate) {
      if (index < 0 || index >= slides.length) return;
      if (index === currentIndex && animate !== false) return;
      currentIndex = index;
      updateTrack(animate !== false);
      updateAria(index);
      updateProgress(index);
      updateButtons(index);
    }

    if (refPrev) {
      refPrev.addEventListener("click", function () {
        goTo(currentIndex - 1);
      });
    }

    if (refNext) {
      refNext.addEventListener("click", function () {
        goTo(currentIndex + 1);
      });
    }

    if (carouselViewport) {
      carouselViewport.addEventListener("keydown", function (e) {
        if (
          e.key !== "ArrowLeft" &&
          e.key !== "ArrowRight" &&
          e.key !== "Home" &&
          e.key !== "End"
        ) {
          return;
        }
        e.preventDefault();
        if (e.key === "ArrowLeft") goTo(currentIndex - 1);
        else if (e.key === "ArrowRight") goTo(currentIndex + 1);
        else if (e.key === "Home") goTo(0);
        else if (e.key === "End") goTo(slides.length - 1);
      });

      carouselViewport.addEventListener(
        "touchstart",
        function (e) {
          if (e.touches.length !== 1) return;
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
          touchDeltaX = 0;
          touchLocked = null;
          carouselTrack.style.transition = "none";
        },
        { passive: true }
      );

      carouselViewport.addEventListener(
        "touchmove",
        function (e) {
          if (e.touches.length !== 1) return;
          var deltaX = e.touches[0].clientX - touchStartX;
          var deltaY = e.touches[0].clientY - touchStartY;

          if (touchLocked === null && (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8)) {
            touchLocked = Math.abs(deltaX) > Math.abs(deltaY) ? "x" : "y";
          }

          if (touchLocked !== "x") return;

          touchDeltaX = deltaX;
          var slideWidth = carouselViewport.offsetWidth;
          var baseOffset = -currentIndex * slideWidth;
          var nextOffset = baseOffset + touchDeltaX;
          var minOffset = -(slides.length - 1) * slideWidth;
          nextOffset = Math.max(minOffset, Math.min(0, nextOffset));
          carouselTrack.style.transform = "translate3d(" + nextOffset + "px, 0, 0)";
        },
        { passive: true }
      );

      carouselViewport.addEventListener("touchend", function () {
        if (touchLocked !== "x") {
          updateTrack(true);
          return;
        }

        if (touchDeltaX <= -SWIPE_THRESHOLD && currentIndex < slides.length - 1) {
          goTo(currentIndex + 1);
        } else if (touchDeltaX >= SWIPE_THRESHOLD && currentIndex > 0) {
          goTo(currentIndex - 1);
        } else {
          updateTrack(true);
        }

        touchDeltaX = 0;
        touchLocked = null;
      });
    }

    goTo(0, false);

    window.addEventListener("resize", function () {
      updateTrack(false);
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (siteNav && siteNav.classList.contains("is-open")) setNavOpen(false);
    if (dialog && dialog.open) dialog.close();
  });
})();
