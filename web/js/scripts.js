export function initSiteUI(root = document) {
  const abortController = new AbortController();
  const { signal } = abortController;
  const fullscreenToggles = Array.from(root.querySelectorAll(".site-fullscreen-toggle"));
  const toggles = Array.from(root.querySelectorAll(".site-panel-toggle"));
  const siteNav = root.querySelector(".site-nav");
  let originalNavTop = null;

  const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement;
  const canEnterFullscreen = () => Boolean(
    document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen
  );

  const syncFullscreenButtons = () => {
    if (!fullscreenToggles.length) {
      return;
    }

    const isFullscreen = Boolean(fullscreenElement());

    fullscreenToggles.forEach((toggle) => {
      toggle.setAttribute("aria-pressed", isFullscreen ? "true" : "false");
      toggle.setAttribute("aria-label", isFullscreen ? "Exit fullscreen" : "Enter fullscreen");
      toggle.setAttribute("title", isFullscreen ? "Exit fullscreen" : "Enter fullscreen");
    });
  };

  if (fullscreenToggles.length) {
    if (!canEnterFullscreen()) {
      fullscreenToggles.forEach((toggle) => {
        toggle.hidden = true;
      });
    } else {
      fullscreenToggles.forEach((toggle) => {
        toggle.addEventListener("click", async () => {
          try {
            if (fullscreenElement()) {
              if (document.exitFullscreen) {
                await document.exitFullscreen();
              } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
              }
            } else if (document.documentElement.requestFullscreen) {
              await document.documentElement.requestFullscreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
              document.documentElement.webkitRequestFullscreen();
            }
          } catch (error) {
            console.error("Fullscreen toggle failed", error);
          } finally {
            syncFullscreenButtons();
          }
        }, { signal });
      });

      document.addEventListener("fullscreenchange", syncFullscreenButtons, { signal });
      document.addEventListener("webkitfullscreenchange", syncFullscreenButtons, { signal });
      syncFullscreenButtons();
    }
  }

  if (!toggles.length) {
    return () => {
      abortController.abort();
    };
  }

  const pairs = toggles
    .map((toggle) => {
      const panelId = toggle.getAttribute("aria-controls");
      const panel = panelId ? root.querySelector(`#${panelId}`) : null;
      return panel ? { toggle, panel } : null;
    })
    .filter(Boolean);

  if (!pairs.length) {
    return () => {
      abortController.abort();
    };
  }

  const isPhoneViewport = () => window.matchMedia("(max-width: 500px)").matches;

  const resetNavPosition = () => {
    if (!siteNav || originalNavTop === null) {
      return;
    }

    siteNav.style.top = originalNavTop;
    originalNavTop = null;
  };

  const moveNavIntoView = () => {
    if (!siteNav || !isPhoneViewport()) {
      return;
    }

    const desiredTop = 14;
    const computedTop = Number.parseFloat(window.getComputedStyle(siteNav).top);
    const currentTop = Number.isNaN(computedTop) ? 0 : computedTop;
    const rect = siteNav.getBoundingClientRect();
    const topDelta = desiredTop - rect.top;

    if (Math.abs(topDelta) < 1) {
      return;
    }

    if (originalNavTop === null) {
      originalNavTop = siteNav.style.top;
    }

    siteNav.style.top = `${currentTop + topDelta}px`;
  };

  const closeAll = () => {
    pairs.forEach(({ toggle, panel }) => {
      toggle.setAttribute("aria-expanded", "false");
      panel.setAttribute("aria-hidden", "true");
      panel.classList.remove("is-open");
    });

    resetNavPosition();
  };

  const setOpen = (selectedToggle, open) => {
    closeAll();

    if (!open) {
      return;
    }

    const selectedPair = pairs.find(({ toggle }) => toggle === selectedToggle);

    if (!selectedPair) {
      return;
    }

    selectedPair.toggle.setAttribute("aria-expanded", "true");
    selectedPair.panel.setAttribute("aria-hidden", "false");
    selectedPair.panel.classList.add("is-open");
    moveNavIntoView();
  };

  pairs.forEach(({ toggle, panel }) => {
    toggle.addEventListener("click", () => {
      setOpen(toggle, !panel.classList.contains("is-open"));
    }, { signal });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAll();
    }
  }, { signal });

  document.addEventListener("click", (event) => {
    const clickedToggle = pairs.some(({ toggle }) => toggle.contains(event.target));
    const clickedPanel = pairs.some(({ panel }) => panel.contains(event.target));

    if (!clickedToggle && !clickedPanel) {
      closeAll();
    }
  }, { signal });

  window.addEventListener("resize", () => {
    if (!pairs.some(({ panel }) => panel.classList.contains("is-open"))) {
      return;
    }

    if (!isPhoneViewport()) {
      resetNavPosition();
      return;
    }

    moveNavIntoView();
  }, { signal });

  return () => {
    closeAll();
    abortController.abort();
  };
}
