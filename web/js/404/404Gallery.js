export function init404Gallery(root = document) {
  const mediaItems = Array.from(root.querySelectorAll(".not-found-page__media-item"));
  let intervalId = null;

  if (!mediaItems.length) {
    return {
      destroy() {},
    };
  }

  let activeIndex = 0;

  const syncPlayback = () => {
    mediaItems.forEach((item, index) => {
      if (item.tagName !== "VIDEO") {
        return;
      }

      if (index === activeIndex) {
        item.currentTime = 0;
        item.play().catch(() => {});
      } else {
        item.pause();
      }
    });
  };

  syncPlayback();

  if (mediaItems.length > 1 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    intervalId = window.setInterval(() => {
      mediaItems[activeIndex].classList.remove("is-active");
      activeIndex = (activeIndex + 1) % mediaItems.length;
      mediaItems[activeIndex].classList.add("is-active");
      syncPlayback();
    }, 2800);
  }

  return {
    destroy() {
      if (intervalId) {
        window.clearInterval(intervalId);
      }

      mediaItems.forEach((item) => {
        item.classList.remove("is-active");

        if (item.tagName === "VIDEO") {
          item.pause();
        }
      });
    },
  };
}
