(function() {
  const mediaItems = Array.from(document.querySelectorAll(".not-found-page__media-item"));

  if (!mediaItems.length) {
    return;
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

  if (mediaItems.length < 2) {
    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  window.setInterval(() => {
    mediaItems[activeIndex].classList.remove("is-active");
    activeIndex = (activeIndex + 1) % mediaItems.length;
    mediaItems[activeIndex].classList.add("is-active");
    syncPlayback();
  }, 2800);
})();
