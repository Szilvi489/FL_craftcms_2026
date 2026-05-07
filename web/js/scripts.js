(function() {
  const toggles = Array.from(document.querySelectorAll(".site-panel-toggle"));
  const siteNav = document.querySelector(".site-nav");
  let originalNavTop = null;

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
