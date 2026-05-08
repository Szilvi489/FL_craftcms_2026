(function() {
  const fullscreenToggles = Array.from(document.querySelectorAll(".site-fullscreen-toggle"));
  const toggles = Array.from(document.querySelectorAll(".site-panel-toggle"));
  const homeLink = document.querySelector(".site-home-link");
  const siteNav = document.querySelector(".site-nav");
  const hasSharedPageTransition = Boolean(document.querySelector(".page-transition"));
  const homeRevealStorageKey = "home-reveal-target";
  let originalNavTop = null;

  const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement;
  const canEnterFullscreen = () => Boolean(
    document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen
  );
  const canExitFullscreen = () => Boolean(
    document.exitFullscreen || document.webkitExitFullscreen
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
        });
      });

      document.addEventListener("fullscreenchange", syncFullscreenButtons);
      document.addEventListener("webkitfullscreenchange", syncFullscreenButtons);
      syncFullscreenButtons();
    }
  }

  if (homeLink && !hasSharedPageTransition) {
    const homePathname = new URL(homeLink.href).pathname;

    if (window.location.pathname !== homePathname) {
      homeLink.addEventListener("click", async (event) => {
        try {
          window.sessionStorage.setItem(homeRevealStorageKey, "1");
        } catch (error) {
          // Ignore storage failures and fall back to the hash-only behavior.
        }

        if (!fullscreenElement()) {
          return;
        }

        event.preventDefault();

        try {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          }
        } catch (error) {
          console.error("Exiting fullscreen before home navigation failed", error);
        } finally {
          window.location.href = homeLink.href;
        }
      });
    }
  }

  if (!toggles.length) {
    return;
  }

  const pairs = toggles
    .map((toggle) => {
      const panelId = toggle.getAttribute("aria-controls");
      const panel = panelId ? document.getElementById(panelId) : null;
      return panel ? { toggle, panel } : null;
    })
    .filter(Boolean);

  if (!pairs.length) {
    return;
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
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAll();
    }
  });

  document.addEventListener("click", (event) => {
    const clickedToggle = pairs.some(({ toggle }) => toggle.contains(event.target));
    const clickedPanel = pairs.some(({ panel }) => panel.contains(event.target));

    if (!clickedToggle && !clickedPanel) {
      closeAll();
    }
  });

  window.addEventListener("resize", () => {
    if (!pairs.some(({ panel }) => panel.classList.contains("is-open"))) {
      return;
    }

    if (!isPhoneViewport()) {
      resetNavPosition();
      return;
    }

    moveNavIntoView();
  });
})();
