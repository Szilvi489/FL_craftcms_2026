(function() {
  const desktopList = document.querySelector(".project-list");
  const desktopBackground = document.querySelector(".projects-index__background");
  const mobileBackground = document.querySelector(".projects-index__mobile-background");
  const desktopBackgroundItems = Array.from(document.querySelectorAll(".projects-index__background-item"));
  const mobileBackgroundItems = Array.from(document.querySelectorAll(".projects-index__mobile-background-item"));
  const mobileCards = Array.from(document.querySelectorAll(".project-mobile-card"));

  const createPreviewController = (items, defaultKey = "") => {
    if (!items.length) {
      return null;
    }

    const itemsByKey = new Map(items.map((item) => [item.dataset.previewKey, item]));
    let activeItem = null;

    const syncVideoPlayback = () => {
      items.forEach((item) => {
        const video = item.querySelector("video");

        if (!video) {
          return;
        }

        if (item === activeItem) {
          if (video.paused) {
            video.currentTime = 0;
          }
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    };

    const setActiveItem = (key) => {
      if (activeItem) {
        activeItem.classList.remove("is-active");
      }

      const nextKey = key || defaultKey;
      activeItem = nextKey ? itemsByKey.get(nextKey) || null : null;

      if (activeItem) {
        activeItem.classList.add("is-active");
      }

      syncVideoPlayback();
    };

    if (defaultKey) {
      setActiveItem(defaultKey);
    } else {
      syncVideoPlayback();
    }

    return {
      setActiveItem,
      reset() {
        setActiveItem("");
      },
    };
  };

  const desktopController = createPreviewController(
    desktopBackgroundItems,
    desktopBackground?.dataset.defaultPreviewKey || ""
  );
  const mobileController = createPreviewController(
    mobileBackgroundItems,
    mobileBackground?.dataset.defaultPreviewKey || ""
  );

  if (desktopList && desktopController) {
    desktopList.querySelectorAll(".project-row").forEach((row) => {
      row.addEventListener("pointerenter", () => {
        desktopController.setActiveItem(row.dataset.previewKey || "");
      });

      row.addEventListener("focus", () => {
        desktopController.setActiveItem(row.dataset.previewKey || "");
      });
    });

    desktopList.addEventListener("pointerleave", () => {
      desktopController.reset();
    });

    desktopList.addEventListener("focusout", () => {
      window.requestAnimationFrame(() => {
        if (!desktopList.contains(document.activeElement)) {
          desktopController.reset();
        }
      });
    });
  }

  if (mobileCards.length && mobileController) {
    const updateMobilePreview = () => {
      if (!window.matchMedia("(max-width: 900px)").matches) {
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
    window.addEventListener("scroll", updateMobilePreview, { passive: true });
    window.addEventListener("resize", updateMobilePreview);
  }
})();
