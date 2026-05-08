export function initHomeHero(root = document) {
  const body = document.body;
  const abortController = new AbortController();
  const { signal } = abortController;
  const hero = root.querySelector(".home-hero");
  const hole = hero?.querySelector(".home-hero__hole");
  const introTitle = hero?.querySelector(".intro-title");
  const homeLink = root.querySelector(".site-home-link");
  const siteNav = root.querySelector(".site-nav");
  const navItems = siteNav ? [siteNav] : [];
  const navRevealStart = 0.72;
  const homeRevealHash = "#home-reveal";
  const homeRevealProgress = 0.995;
  let heroTimeline = null;

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

  const destroy = () => {
    abortController.abort();
    setNavRevealed(false);

    if (heroTimeline?.scrollTrigger) {
      heroTimeline.scrollTrigger.kill();
    }

    if (heroTimeline) {
      heroTimeline.kill();
    }

    if (window.gsap) {
      window.gsap.killTweensOf(navItems);
      window.gsap.killTweensOf(hole);
      window.gsap.killTweensOf(introTitle);
      window.gsap.set(navItems, { clearProps: "opacity,visibility,transform" });
      window.gsap.set(hole, { clearProps: "transform" });
      window.gsap.set(introTitle, { clearProps: "opacity,visibility,transform" });
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
  gsap.set(navItems, {
    autoAlpha: 0,
    y: -24,
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

  const centerNavRowInViewport = () => {
    const currentY = Number(gsap.getProperty(siteNav, "y")) || 0;
    gsap.set(siteNav, { y: 0 });
    const rect = siteNav.getBoundingClientRect();
    gsap.set(siteNav, { y: currentY });
    const currentCenter = rect.top + rect.height / 2;
    const targetCenter = window.innerHeight / 2;

    return targetCenter - currentCenter;
  };

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
        setNavRevealed(self.progress >= navRevealStart);
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
    y: centerNavRowInViewport,
    ease: "none",
    duration: 0.58,
  }, 0.22);

  const getHomeRevealScrollTop = () => {
    const trigger = heroTimeline?.scrollTrigger;

    if (!trigger) {
      return 0;
    }

    return trigger.start + ((trigger.end - trigger.start) * homeRevealProgress);
  };

  const scrollToHomeReveal = (behavior) => {
    window.scrollTo({
      top: getHomeRevealScrollTop(),
      behavior,
    });
  };

  const reveal = async () => {
    ScrollTrigger.refresh();
    await waitForFrames(1);
    scrollToHomeReveal("auto");
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
    scrollToHomeReveal("auto");
    ScrollTrigger.update();
    await waitForFrames(2);
    ScrollTrigger.refresh();
    ScrollTrigger.update();

    const revealY = centerNavRowInViewport();
    const holeScale = scaleToCoverViewport();
    gsap.set(hole, {
      scale: holeScale,
    });
    gsap.set(introTitle, {
      autoAlpha: 0,
      y: -650,
    });
    setNavRevealed(true);
    gsap.killTweensOf(navItems);
    gsap.set(navItems, {
      autoAlpha: 0,
      y: revealY - 24,
    });

    return true;
  };

  const animateNavIntoReveal = async () => {
    scrollToHomeReveal("auto");
    ScrollTrigger.update();
    const revealY = centerNavRowInViewport();
    setNavRevealed(true);
    gsap.killTweensOf(navItems);
    gsap.set(navItems, {
      autoAlpha: 0,
      y: revealY - 24,
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
      y: centerNavRowInViewport(),
    });
  };

  if (homeLink && window.location.pathname === new URL(homeLink.href, window.location.href).pathname) {
    homeLink.addEventListener("click", (event) => {
      const targetUrl = new URL(homeLink.href, window.location.href);
      const isSameDocument = (
        targetUrl.pathname === window.location.pathname &&
        targetUrl.search === window.location.search
      );

      if (!isSameDocument) {
        return;
      }

      event.preventDefault();
      ScrollTrigger.refresh();
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${homeRevealHash}`);
      scrollToHomeReveal("smooth");
    }, { signal });
  }

  return {
    destroy,
    reveal,
    prepareRevealForTransition,
    animateNavIntoReveal,
  };
}
