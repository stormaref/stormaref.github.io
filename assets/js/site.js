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
    var carouselViewport = referencesCarousel.querySelector(
      ".references-carousel__viewport"
    );
    var carouselTrack = referencesCarousel.querySelector(
      ".references-carousel__track"
    );
    var carouselDots = referencesCarousel.querySelector(
      ".references-carousel__dots"
    );
    var slides = referencesCarousel.querySelectorAll(".reference");
    var FLIP_DURATION = 280;

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
        carouselViewport.style.minHeight = maxHeight + "px";
        carouselTrack.style.minHeight = maxHeight + "px";
      }
    }

    measureSlideHeights();

    if (slides.length <= 1) {
      if (carouselDots) carouselDots.hidden = true;
    } else {
      var currentIndex = 0;
      var isAnimating = false;
      var dotButtons = [];

      slides.forEach(function (slide, index) {
        if (!slide.id) slide.id = "reference-" + (index + 1);
      });

      function updateDots(index) {
        dotButtons.forEach(function (btn, i) {
          var selected = i === index;
          btn.classList.toggle("is-active", selected);
          btn.setAttribute("aria-selected", selected ? "true" : "false");
          btn.tabIndex = selected ? 0 : -1;
        });
        if (carouselViewport) {
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
      }

      function finishTransition(index) {
        slides.forEach(function (slide, i) {
          slide.classList.remove(
            "is-active",
            "is-exiting",
            "is-entering",
            "is-exiting-next",
            "is-exiting-prev",
            "is-entering-next",
            "is-entering-prev"
          );
          if (i === index) slide.classList.add("is-active");
        });
        currentIndex = index;
        isAnimating = false;
        updateDots(index);
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
        current.classList.remove("is-active");
        current.classList.add(
          "is-exiting",
          direction > 0 ? "is-exiting-next" : "is-exiting-prev"
        );
        target.classList.add(
          "is-entering",
          direction > 0 ? "is-entering-next" : "is-entering-prev"
        );

        requestAnimationFrame(function () {
          target.classList.add("is-active");
        });

        window.setTimeout(function () {
          finishTransition(index);
        }, FLIP_DURATION);
      }

      slides.forEach(function (slide, index) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "references-carousel__dot";
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-controls", slide.id);
        var author = slide.querySelector(".reference__author");
        btn.setAttribute(
          "aria-label",
          author
            ? author.textContent.trim()
            : "Reference " + (index + 1)
        );
        btn.addEventListener("click", function () {
          goTo(index);
        });
        carouselDots.appendChild(btn);
        dotButtons.push(btn);
      });

      updateDots(0);

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

        var touchStartY = 0;
        carouselViewport.addEventListener(
          "touchstart",
          function (e) {
            touchStartY = e.touches[0].clientY;
          },
          { passive: true }
        );
        carouselViewport.addEventListener(
          "touchend",
          function (e) {
            var dy = e.changedTouches[0].clientY - touchStartY;
            if (Math.abs(dy) < 40) return;
            if (dy < 0) goTo(currentIndex + 1);
            else goTo(currentIndex - 1);
          },
          { passive: true }
        );
      }
    }
  }

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (siteNav && siteNav.classList.contains("is-open")) setNavOpen(false);
    if (dialog && dialog.open) dialog.close();
  });
})();
