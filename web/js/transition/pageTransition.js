(function() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const transitionKey = "site-page-transition";
  const homeRevealStorageKey = "home-reveal-target";
  const NAV_OUT_DURATION = 420;
  const NAV_IN_DURATION = 420;
  const COVER_CLOSE_DURATION = 2000;
  const PAGE_CHANGE_HOLD_DURATION = 1000;
  const COVER_OPEN_DURATION = 2000;
  const html = document.documentElement;
  const body = document.body;
  const { gsap } = window;
  const siteNav = document.querySelector(".site-nav");
  const siteMain = document.querySelector(".site-main");
  const transitionRoot = document.querySelector(".page-transition");
  const transitionWindow = transitionRoot?.querySelector(".page-transition__window");

  if (!gsap || !body || !siteMain || !transitionRoot || !transitionWindow) {
    return;
  }

  let isTransitioning = false;

  const readState = () => {
    try {
      const raw = window.sessionStorage.getItem(transitionKey);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  };

  const writeState = (state) => {
    try {
      window.sessionStorage.setItem(transitionKey, JSON.stringify(state));
    } catch (error) {
      return;
    }
  };

  const clearState = () => {
    try {
      window.sessionStorage.removeItem(transitionKey);
    } catch (error) {
      return;
    }
  };

  const nextFrame = () => new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(resolve);
    });
  });
  const wait = (ms) => new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
  const tweenTo = (target, vars) => new Promise((resolve) => {
    gsap.to(target, {
      ...vars,
      onComplete: resolve,
      onInterrupt: resolve,
    });
  });

  const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement;
  const shouldPrepareHomeReveal = () => {
    if (window.location.hash === "#home-reveal") {
      return true;
    }

    try {
      return window.sessionStorage.getItem(homeRevealStorageKey) === "1";
    } catch (error) {
      return false;
    }
  };

  const exitFullscreenIfNeeded = async () => {
    if (!fullscreenElement()) {
      return;
    }

    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    } catch (error) {
      return;
    }
  };

  const getCoverScale = (oversizeMultiplier = 1) => {
    const rect = transitionWindow.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxDistance = Math.max(
      Math.hypot(centerX, centerY),
      Math.hypot(window.innerWidth - centerX, centerY),
      Math.hypot(centerX, window.innerHeight - centerY),
      Math.hypot(window.innerWidth - centerX, window.innerHeight - centerY)
    );

    return Math.max(1, ((maxDistance * 2) / rect.width) * oversizeMultiplier);
  };

  const resetPreview = () => {
    return;
  };

  const animateNavOut = async () => {
    if (!siteNav) {
      return;
    }

    const currentY = Number(gsap.getProperty(siteNav, "y")) || 0;

    gsap.killTweensOf(siteNav);
    gsap.set(siteNav, {
      autoAlpha: 1,
      y: currentY,
    });

    await tweenTo(siteNav, {
      autoAlpha: 0,
      y: currentY - 24,
      duration: NAV_OUT_DURATION / 1000,
      ease: "power2.inOut",
    });
  };

  const animateNavIn = async () => {
    if (!siteNav) {
      return;
    }

    gsap.killTweensOf(siteNav);
    gsap.set(siteNav, {
      autoAlpha: 0,
      y: -24,
    });

    await tweenTo(siteNav, {
      autoAlpha: 1,
      y: 0,
      duration: NAV_IN_DURATION / 1000,
      ease: "power2.inOut",
      clearProps: "opacity,visibility,transform",
    });
  };

  const playLeaveTransition = async (href) => {
    isTransitioning = true;
    await animateNavOut();

    resetPreview();
    const coverScale = getCoverScale(1.35);
    gsap.killTweensOf(transitionWindow);
    gsap.set(transitionWindow, {
      scale: coverScale,
      force3D: true,
    });
    transitionRoot.classList.add("is-active");

    writeState({
      href,
      ts: Date.now(),
    });

    await nextFrame();

    await tweenTo(transitionWindow, {
      scale: 1,
      duration: COVER_CLOSE_DURATION / 1000,
      ease: "power2.inOut",
    });
    window.location.href = href;
  };

  const playEnterTransition = async (state) => {
    if (!state) {
      html.classList.remove("has-page-transition-enter");
      clearState();
      return;
    }

    transitionRoot.classList.add("is-active");
    resetPreview();
    gsap.killTweensOf(transitionWindow);
    gsap.set(transitionWindow, {
      scale: 1,
      force3D: true,
    });

    if (siteNav) {
      gsap.set(siteNav, {
        autoAlpha: 0,
        y: -24,
      });
    }

    html.classList.remove("has-page-transition-enter");
    clearState();

    await nextFrame();

    let preparedHomeReveal = false;

    if (
      shouldPrepareHomeReveal() &&
      window.__homeHeroTransition &&
      typeof window.__homeHeroTransition.applyRevealForPageTransition === "function"
    ) {
      preparedHomeReveal = await window.__homeHeroTransition.applyRevealForPageTransition();
      await nextFrame();
    }

    await wait(PAGE_CHANGE_HOLD_DURATION);

    const coverScale = getCoverScale(1.35);

    await tweenTo(transitionWindow, {
      scale: coverScale,
      duration: COVER_OPEN_DURATION / 1000,
      ease: "power2.inOut",
    });

    transitionRoot.classList.remove("is-active");
    gsap.set(transitionWindow, {
      clearProps: "transform",
    });
    resetPreview();

    if (!preparedHomeReveal) {
      await animateNavIn();
    }

    isTransitioning = false;
    window.dispatchEvent(new CustomEvent("site:page-transition-enter-finished"));
  };

  document.addEventListener("click", async (event) => {
    if (event.defaultPrevented || isTransitioning) {
      return;
    }

    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const link = event.target.closest("a[href]");

    if (!link || link.target === "_blank" || link.hasAttribute("download")) {
      return;
    }

    const href = link.href;

    if (!href) {
      return;
    }

    const url = new URL(href, window.location.href);

    if (url.origin !== window.location.origin) {
      return;
    }

    const isSameDocument = (
      url.pathname === window.location.pathname &&
      url.search === window.location.search
    );

    if (isSameDocument) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (link.classList.contains("site-home-link")) {
      try {
        window.sessionStorage.setItem(homeRevealStorageKey, "1");
      } catch (error) {
        // Ignore storage errors and continue with the page transition.
      }
    }

    await exitFullscreenIfNeeded();
    await playLeaveTransition(url.href);
  }, true);

  const initialState = readState();

  if (html.classList.contains("has-page-transition-enter")) {
    if (!initialState) {
      html.classList.remove("has-page-transition-enter");
      clearState();
      return;
    }

    const startEnterTransition = () => {
      window.requestAnimationFrame(() => {
        playEnterTransition(initialState);
      });
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", startEnterTransition, { once: false });
    } else {
      startEnterTransition();
    }
  }
})();
