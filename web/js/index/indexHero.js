(function() {
  const body = document.body;
  const hero = document.querySelector(".home-hero");
  const hole = hero?.querySelector(".home-hero__hole");
  const introTitle = hero?.querySelector(".intro-title");
  const siteNav = document.querySelector(".site-nav");
  const navItems = siteNav ? [siteNav] : [];
  const navRevealStart = 0.72;

  const setNavRevealed = (revealed) => {
    body.classList.toggle("home-nav-revealed", revealed);
  };

  if (!hero || !hole || !introTitle || navItems.length === 0) {
    setNavRevealed(true);
    return;
  }

  if (!window.gsap || !window.ScrollTrigger) {
    setNavRevealed(true);
    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    setNavRevealed(true);
    return;
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

  const heroTimeline = gsap.timeline({
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
})();
