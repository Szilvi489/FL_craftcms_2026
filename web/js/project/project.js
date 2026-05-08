export function initProjectPage(root = document) {
  const { gsap } = window;
  const pageRoot = root.querySelector(".project");
  const projectVideos = Array.from(root.querySelectorAll(".project video"));
  const ENTER_OFFSET_Y = -44;
  const ENTER_DURATION = 0.75;
  const LEAVE_DURATION = 0.4;
  let isPreparedForTransition = false;
  let hasRunEnterAnimation = false;
  const getAnimatedTargets = () => Array
    .from(root.querySelectorAll(".project-intro__content > *, .text-block, figcaption"))
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

    pageRoot?.classList.add("project--transition-prep");

    if (!gsap || !targets.length) {
      return;
    }

    gsap.killTweensOf(targets);
    gsap.set(targets, {
      autoAlpha: 0,
      y: ENTER_OFFSET_Y,
    });
  };

  const clearEnterPrepState = () => {
    pageRoot?.classList.remove("project--transition-prep");
  };

  const runEnterAnimation = async () => {
    const targets = getAnimatedTargets();

    if (!gsap || !targets.length) {
      clearEnterPrepState();
      return;
    }

    setEnterStartState();

    await tweenTo(targets, {
      autoAlpha: 1,
      y: 0,
      duration: ENTER_DURATION,
      ease: "power2.out",
      stagger: 0.05,
    });

    clearEnterPrepState();
    gsap.set(targets, {
      clearProps: "opacity,visibility,transform",
    });
    hasRunEnterAnimation = true;
  };

  projectVideos.forEach((video) => {
    video.play().catch(() => {});
  });

  if (gsap && !document.documentElement.classList.contains("is-barba-transitioning")) {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (!isPreparedForTransition && !hasRunEnterAnimation) {
          runEnterAnimation();
        }
      });
    });
  }

  return {
    prepareEnterForTransition() {
      isPreparedForTransition = true;
      setEnterStartState();
    },
    async animateEnter() {
      isPreparedForTransition = false;
      await runEnterAnimation();
    },
    async animateLeave() {
      const targets = getAnimatedTargets();

      if (!gsap || !targets.length) {
        return;
      }

      gsap.killTweensOf(targets);

      await tweenTo(targets, {
        autoAlpha: 0,
        y: ENTER_OFFSET_Y,
        duration: LEAVE_DURATION,
        ease: "power2.inOut",
        stagger: 0.025,
      });
    },
    destroy() {
      clearEnterPrepState();
      if (gsap) {
        gsap.killTweensOf(getAnimatedTargets());
      }
      projectVideos.forEach((video) => {
        video.pause();
      });
    },
  };
}
