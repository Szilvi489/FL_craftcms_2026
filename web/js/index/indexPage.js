export function initIndexPage(root = document) {
  const INDEX_LOCKED_PREVIEW_STORAGE_KEY = "indexLockedPreviewKey";
  const abortController = new AbortController();
  const { signal } = abortController;
  const { gsap } = window;
  const pageRoot = root.querySelector(".projects-index");
  const desktopList = root.querySelector(".project-list__body");
  const desktopBackground = root.querySelector(".projects-index__background");
  const mobileBackground = root.querySelector(".projects-index__mobile-background");
  const desktopBackgroundItems = Array.from(root.querySelectorAll(".projects-index__background-item"));
  const mobileBackgroundItems = Array.from(root.querySelectorAll(".projects-index__mobile-background-item"));
  const mobileCards = Array.from(root.querySelectorAll(".project-mobile-card"));
  const mediaQueries = new Set();
  const restoredPreviewKey = (() => {
    try {
      const storedKey = window.sessionStorage.getItem(INDEX_LOCKED_PREVIEW_STORAGE_KEY) || "";

      if (storedKey) {
        window.sessionStorage.removeItem(INDEX_LOCKED_PREVIEW_STORAGE_KEY);
      }

      return storedKey;
    } catch (error) {
      return "";
    }
  })();
  let isPreviewLocked = false;
  let pointerHasMovedSinceRestore = !restoredPreviewKey;
  const getAnimatedTargets = () => Array
    .from(root.querySelectorAll(".project-row, .project-list__header, .project-mobile-card"))
    .filter((item) => window.getComputedStyle(item).display !== "none");

  const tweenTo = (target, vars) => new Promise((resolve) => {
    if (!gsap || !target || (Array.isArray(target) && target.length === 0)) {
      resolve();
      return;
    }

    gsap.to(target, {
      ...vars,
      onComplete: resolve,
      onInterrupt: resolve,
    });
  });

  const setEnterStartState = () => {
    const targets = getAnimatedTargets();

    pageRoot?.classList.add("projects-index--transition-prep");

    if (!gsap || !targets.length) {
      return;
    }

    gsap.killTweensOf(targets);
    gsap.set(targets, {
      autoAlpha: 0,
      y: -28,
    });
  };

  const persistLockedPreviewKey = (previewKey) => {
    if (!previewKey) {
      return;
    }

    try {
      window.sessionStorage.setItem(INDEX_LOCKED_PREVIEW_STORAGE_KEY, previewKey);
    } catch (error) {
      return;
    }
  };

  const isPlainPrimaryActivation = (event) => {
    if (event.defaultPrevented) {
      return false;
    }

    if ("button" in event && event.button !== 0) {
      return false;
    }

    return !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey);
  };

  const hasRestoredPreviewLock = () => Boolean(restoredPreviewKey) && !pointerHasMovedSinceRestore;

  const lockPreview = (controller, previewKey) => {
    if (!controller || !previewKey) {
      return;
    }

    isPreviewLocked = true;
    controller.setActiveItem(previewKey);
    persistLockedPreviewKey(previewKey);
  };

  const unlockRestoredPreview = () => {
    pointerHasMovedSinceRestore = true;
  };

  const syncVideos = (items, activeItem, shouldPlayActiveVideo = true) => {
    items.forEach((item) => {
      const video = item.querySelector("video");

      if (!video) {
        return;
      }

      if (item === activeItem) {
        if (video.paused) {
          video.currentTime = 0;
        }

        if (shouldPlayActiveVideo) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      } else {
        video.pause();
      }
    });
  };

  const createPreviewController = (items, defaultKey = "", shouldPlayActiveVideo = true) => {
    if (!items.length) {
      return null;
    }

    const itemsByKey = new Map(items.map((item) => [item.dataset.previewKey, item]));
    let activeItem = null;

    const setActiveItem = (key) => {
      items.forEach((item) => item.classList.remove("is-active"));

      const nextKey = key || defaultKey;
      activeItem = nextKey ? itemsByKey.get(nextKey) || null : null;

      if (activeItem) {
        activeItem.classList.add("is-active");
      }

      syncVideos(items, activeItem, shouldPlayActiveVideo);
    };

    if (defaultKey) {
      setActiveItem(defaultKey);
    } else {
      syncVideos(items, activeItem, shouldPlayActiveVideo);
    }

    return {
      setActiveItem,
      reset() {
        setActiveItem("");
      },
      destroy() {
        items.forEach((item) => item.classList.remove("is-active"));
        syncVideos(items, null, shouldPlayActiveVideo);
      },
    };
  };

  const desktopController = createPreviewController(
    desktopBackgroundItems,
    desktopBackground?.dataset.defaultPreviewKey || "",
    false
  );
  const mobileController = createPreviewController(
    mobileBackgroundItems,
    mobileBackground?.dataset.defaultPreviewKey || ""
  );

  if (restoredPreviewKey) {
    desktopController?.setActiveItem(restoredPreviewKey);
    mobileController?.setActiveItem(restoredPreviewKey);
  }

  if (restoredPreviewKey) {
    window.addEventListener("pointermove", (event) => {
      if (pointerHasMovedSinceRestore) {
        return;
      }

      unlockRestoredPreview();

      if (!desktopController || !desktopList) {
        return;
      }

      const hoveredRow = event.target instanceof Element ? event.target.closest(".project-row") : null;

      if (hoveredRow && desktopList.contains(hoveredRow)) {
        desktopController.setActiveItem(hoveredRow.dataset.previewKey || "");
        return;
      }

      desktopController.reset();
    }, { signal });
  }

  if (desktopList && desktopController) {
    desktopList.querySelectorAll(".project-row").forEach((row) => {
      const previewKey = row.dataset.previewKey || "";

      row.addEventListener("pointerenter", () => {
        if (isPreviewLocked || hasRestoredPreviewLock()) {
          return;
        }

        desktopController.setActiveItem(previewKey);
      }, { signal });

      row.addEventListener("focus", () => {
        if (isPreviewLocked) {
          return;
        }

        unlockRestoredPreview();
        desktopController.setActiveItem(previewKey);
      }, { signal });

      row.addEventListener("pointerdown", (event) => {
        if (!isPlainPrimaryActivation(event)) {
          return;
        }

        lockPreview(desktopController, previewKey);
      }, { signal });

      row.addEventListener("click", (event) => {
        if (!isPlainPrimaryActivation(event)) {
          return;
        }

        lockPreview(desktopController, previewKey);
      }, { signal });
    });

    desktopList.addEventListener("pointerleave", () => {
      if (isPreviewLocked || hasRestoredPreviewLock()) {
        return;
      }

      desktopController.reset();
    }, { signal });

    desktopList.addEventListener("focusout", () => {
      window.requestAnimationFrame(() => {
        if (isPreviewLocked) {
          return;
        }

        if (!desktopList.contains(document.activeElement)) {
          unlockRestoredPreview();
          desktopController.reset();
        }
      });
    }, { signal });
  }

  if (mobileCards.length && mobileController) {
    const mobileQuery = window.matchMedia("(max-width: 900px)");
    mediaQueries.add(mobileQuery);

    const updateMobilePreview = () => {
      if (hasRestoredPreviewLock()) {
        return;
      }

      if (!mobileQuery.matches) {
        mobileController.reset();
        return;
      }

      const triggerY = window.innerHeight / 2;
      let nextKey = mobileBackground?.dataset.defaultPreviewKey || mobileCards[0]?.dataset.previewKey || "";

      mobileCards.forEach((card) => {
        const inset = card.querySelector(".project-mobile-card__inset");
        const reference = inset || card;

        if (reference.getBoundingClientRect().top <= triggerY && card.dataset.previewKey) {
          nextKey = card.dataset.previewKey;
        }
      });

      mobileController.setActiveItem(nextKey);
    };

    updateMobilePreview();
    window.addEventListener("scroll", () => {
      unlockRestoredPreview();
      updateMobilePreview();
    }, { passive: true, signal });
    window.addEventListener("resize", () => {
      unlockRestoredPreview();
      updateMobilePreview();
    }, { signal });
    mobileQuery.addEventListener("change", updateMobilePreview, { signal });

    mobileCards.forEach((card) => {
      const previewKey = card.dataset.previewKey || "";

      card.addEventListener("pointerdown", (event) => {
        if (!isPlainPrimaryActivation(event)) {
          return;
        }

        lockPreview(mobileController, previewKey);
      }, { signal });

      card.addEventListener("click", (event) => {
        if (!isPlainPrimaryActivation(event)) {
          return;
        }

        lockPreview(mobileController, previewKey);
      }, { signal });
    });
  }

  return {
    prepareEnterForTransition() {
      setEnterStartState();
    },
    async animateEnter() {
      const targets = getAnimatedTargets();

      if (!gsap || !targets.length) {
        return;
      }

      setEnterStartState();

      await tweenTo(targets, {
        autoAlpha: 1,
        y: 0,
        duration: 0.55,
        ease: "power2.out",
        stagger: 0.04,
      });

      pageRoot?.classList.remove("projects-index--transition-prep");
      gsap.set(targets, {
        clearProps: "opacity,visibility,transform",
      });
    },
    async animateLeave() {
      const targets = getAnimatedTargets();

      if (!gsap || !targets.length) {
        return;
      }

      gsap.killTweensOf(targets);

      await tweenTo(targets, {
        autoAlpha: 0,
        y: -28,
        duration: 0.35,
        ease: "power2.inOut",
        stagger: 0.025,
      });
    },
    destroy() {
      abortController.abort();
      pageRoot?.classList.remove("projects-index--transition-prep");
      if (gsap) {
        gsap.killTweensOf(getAnimatedTargets());
      }
      desktopController?.destroy();
      mobileController?.destroy();
      mediaQueries.clear();
    },
  };
}
