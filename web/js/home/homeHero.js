export function initHomeHero(root = document) {
  const body = document.body;
  const abortController = new AbortController();
  const { signal } = abortController;
  const homeRevealApiKey = "__siteHomeReveal";
  const hero = root.querySelector(".home-hero");
  const hole = hero?.querySelector(".home-hero__hole");
  const introTitle = hero?.querySelector(".intro-title");
  const homeLink = root.querySelector(".site-home-link");
  const siteNav = root.querySelector(".site-nav");
  const selectedWorkSection = root.querySelector("[data-home-selected-work]");
  const selectedWorkHeading = selectedWorkSection?.querySelector(".home-selected-work__header");
  const selectedWorkCards = Array.from(root.querySelectorAll("[data-home-work-card]"));
  const slideshows = Array.from(root.querySelectorAll("[data-home-card-slideshow]"));
  const cardVideos = Array.from(root.querySelectorAll("[data-home-card-video]"));
  const navItems = siteNav ? [siteNav] : [];
  const navRevealStart = 0.72;
  const navRevealDuration = 0.18;
  const homeRevealHash = "#home-reveal";
  const homeRevealScrollDuration = 1.05;
  // Return to the first fully revealed hero/nav state, not the later hero-exit state.
  const homeRevealProgress = Math.min(1, navRevealStart + navRevealDuration + 0.02);
  let heroTimeline = null;
  let selectedWorkTimeline = null;
  const slideIntervals = [];
  const homeRevealScrollState = { y: window.scrollY };

  const waitForFrames = (count = 1) => new Promise((resolve) => {
    const step = () => {
      if (count <= 0) {
        resolve();
        return;
      }

      count -= 1;
      window.requestAnimationFrame(step);
    };

    window.requestAnimationFrame(step);
  });

  const tweenTo = (target, vars) => new Promise((resolve) => {
    gsap.to(target, {
      ...vars,
      onComplete: resolve,
      onInterrupt: resolve,
    });
  });

  const setNavRevealed = (revealed) => {
    body.classList.toggle("home-nav-revealed", revealed);
  };

  const setNavRevealState = (progress) => {
    const revealed = progress >= navRevealStart;
    setNavRevealed(revealed);

    if (!revealed) {
      siteNav?.classList.remove("is-hidden-by-scroll");
    }
  };

  const destroy = () => {
    abortController.abort();
    setNavRevealed(false);
    if (window[homeRevealApiKey]) {
      delete window[homeRevealApiKey];
    }
    slideIntervals.splice(0).forEach((intervalId) => {
      window.clearInterval(intervalId);
    });

    if (heroTimeline?.scrollTrigger) {
      heroTimeline.scrollTrigger.kill();
    }

    if (selectedWorkTimeline?.scrollTrigger) {
      selectedWorkTimeline.scrollTrigger.kill();
    }

    if (heroTimeline) {
      heroTimeline.kill();
    }

    if (selectedWorkTimeline) {
      selectedWorkTimeline.kill();
    }

    if (window.gsap) {
      window.gsap.killTweensOf(navItems);
      window.gsap.killTweensOf(hole);
      window.gsap.killTweensOf(introTitle);
      window.gsap.killTweensOf(homeRevealScrollState);
      window.gsap.killTweensOf(selectedWorkCards);
      window.gsap.killTweensOf(selectedWorkHeading);
      window.gsap.set(navItems, { clearProps: "opacity,visibility,transform" });
      window.gsap.set(hole, { clearProps: "transform" });
      window.gsap.set(introTitle, { clearProps: "opacity,visibility,transform" });
      window.gsap.set(selectedWorkCards, { clearProps: "opacity,visibility,transform" });
      window.gsap.set(selectedWorkHeading, { clearProps: "opacity,visibility,transform" });
    }
  };

  if (!hero || !hole || !introTitle || navItems.length === 0) {
    setNavRevealed(true);
    return { destroy };
  }

  if (!window.gsap || !window.ScrollTrigger || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    setNavRevealed(true);
    return { destroy };
  }

  const { gsap } = window;
  const { ScrollTrigger } = window;

  gsap.registerPlugin(ScrollTrigger);

  const tweenWindowScrollTo = (targetY, duration = homeRevealScrollDuration) => new Promise((resolve) => {
    homeRevealScrollState.y = window.scrollY;
    gsap.killTweensOf(homeRevealScrollState);
    gsap.to(homeRevealScrollState, {
      y: targetY,
      duration,
      ease: "power2.inOut",
      overwrite: true,
      onUpdate: () => {
        window.scrollTo(0, homeRevealScrollState.y);
        ScrollTrigger.update();
      },
      onComplete: resolve,
      onInterrupt: resolve,
    });
  });

  const scaleToCoverViewport = () => {
    gsap.set(hole, { scale: 1 });

    const rect = hole.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxDistance = Math.max(
      Math.hypot(centerX, centerY),
      Math.hypot(window.innerWidth - centerX, centerY),
      Math.hypot(centerX, window.innerHeight - centerY),
      Math.hypot(window.innerWidth - centerX, window.innerHeight - centerY)
    );

    return Math.max(1, (maxDistance * 2) / rect.width);
  };

  const getCenteredNavOffset = () => {
    const currentY = Number(gsap.getProperty(siteNav, "y")) || 0;
    gsap.set(siteNav, { y: 0 });
    const rect = siteNav.getBoundingClientRect();
    gsap.set(siteNav, { y: currentY });
    return rect.height / -2;
  };

  const getHiddenNavOffset = () => getCenteredNavOffset() - 24;

  const initSlideshows = () => {
    slideshows.forEach((slideshow) => {
      const frames = Array.from(slideshow.querySelectorAll("[data-home-card-frame]"));

      if (frames.length <= 1) {
        return;
      }

      let activeIndex = 0;
      const speed = Math.max(Number.parseInt(slideshow.dataset.homeCardSpeed || "1600", 10) || 1600, 120);

      const intervalId = window.setInterval(() => {
        frames[activeIndex]?.classList.remove("is-active");
        activeIndex = (activeIndex + 1) % frames.length;
        frames[activeIndex]?.classList.add("is-active");
      }, speed);

      slideIntervals.push(intervalId);
    });
  };

  const initCardVideos = () => {
    cardVideos.forEach((video) => {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;

      const playVideo = () => {
        const playPromise = video.play();

        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {});
        }
      };

      if (video.readyState >= 2) {
        playVideo();
      } else {
        video.addEventListener("loadeddata", playVideo, { once: true, signal });
      }
    });
  };

  const initSelectedWorkReveal = () => {
    if (!selectedWorkSection || (!selectedWorkHeading && !selectedWorkCards.length)) {
      return;
    }

    const revealTargets = [selectedWorkHeading, ...selectedWorkCards].filter(Boolean);

    gsap.set(revealTargets, {
      autoAlpha: 0,
      y: 48,
    });

    selectedWorkTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: selectedWorkSection,
        start: "top 60%",
        once: true,
      },
    });

    selectedWorkTimeline.to(revealTargets, {
      autoAlpha: 1,
      y: 0,
      duration: 0.9,
      stagger: 0.08,
      ease: "power2.out",
    });
  };

  gsap.set(navItems, {
    autoAlpha: 0,
    y: getHiddenNavOffset,
  });

  heroTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: hero,
      start: "top top",
      end: "+=150%",
      scrub: true,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        setNavRevealState(self.progress);
      },
      onRefresh: (self) => {
        setNavRevealState(self.progress);
      },
    },
  });

  heroTimeline.to(hole, {
    scale: scaleToCoverViewport,
    ease: "none",
    duration: 1,
  }, 0);

  heroTimeline.to(introTitle, {
    y: -650,
    autoAlpha: 0,
    ease: "none",
    duration: 0.55,
  }, 0);

  heroTimeline.to(navItems, {
    autoAlpha: 1,
    y: getCenteredNavOffset,
    ease: "none",
    duration: navRevealDuration,
  }, navRevealStart);

  initSlideshows();
  initCardVideos();
  initSelectedWorkReveal();

  const getHomeRevealScrollTop = () => {
    const trigger = heroTimeline?.scrollTrigger;

    if (!trigger) {
      return 0;
    }

    return trigger.start + ((trigger.end - trigger.start) * homeRevealProgress);
  };

  const scrollToHomeReveal = async (behavior) => {
    const targetY = getHomeRevealScrollTop();

    if (behavior === "smooth") {
      await tweenWindowScrollTo(targetY);
      return targetY;
    }

    window.scrollTo({
      top: targetY,
      behavior,
    });

    return targetY;
  };

  const reveal = async (behavior = "auto") => {
    ScrollTrigger.refresh();
    await waitForFrames(1);
    await scrollToHomeReveal(behavior);
    ScrollTrigger.update();
    await waitForFrames(2);
    ScrollTrigger.refresh();
    ScrollTrigger.update();
    setNavRevealed(true);
    return true;
  };

  const prepareRevealForTransition = async () => {
    ScrollTrigger.refresh();
    await waitForFrames(1);
    await scrollToHomeReveal("auto");
    ScrollTrigger.update();
    await waitForFrames(2);
    ScrollTrigger.refresh();
    ScrollTrigger.update();

    const revealY = getCenteredNavOffset();
    const holeScale = scaleToCoverViewport();
    gsap.set(hole, {
      scale: holeScale,
    });
    gsap.set(introTitle, {
      autoAlpha: 0,
      y: -650,
    });
    setNavRevealed(true);
    gsap.set(navItems, {
      autoAlpha: 0,
      y: getHiddenNavOffset(),
    });

    return true;
  };

  const animateNavIntoReveal = async () => {
    await scrollToHomeReveal("auto");
    ScrollTrigger.update();
    const revealY = getCenteredNavOffset();
    setNavRevealed(true);
    gsap.set(navItems, {
      autoAlpha: 0,
      y: getHiddenNavOffset(),
    });

    await tweenTo(navItems, {
      autoAlpha: 1,
      y: revealY,
      duration: 0.42,
      ease: "power2.inOut",
    });

    await waitForFrames(1);
    ScrollTrigger.refresh();
    ScrollTrigger.update();
    setNavRevealed(true);
    gsap.set(navItems, {
      autoAlpha: 1,
      y: getCenteredNavOffset(),
    });
  };

  if (homeLink && window.location.pathname === new URL(homeLink.href, window.location.href).pathname) {
    homeLink.addEventListener("click", async (event) => {
      const targetUrl = new URL(homeLink.href, window.location.href);
      const isSameDocument = (
        targetUrl.pathname === window.location.pathname &&
        targetUrl.search === window.location.search
      );

      if (!isSameDocument) {
        return;
      }

      event.preventDefault();
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${homeRevealHash}`);
      await reveal("smooth");
    }, { signal });
  }

  window[homeRevealApiKey] = (behavior = "smooth") => reveal(behavior);

  return {
    destroy,
    reveal,
    prepareRevealForTransition,
    animateNavIntoReveal,
  };
}
