import { initSiteUI } from "./scripts.js";
import { initHomeHero } from "./home/homeHero.js";
import { initIndexPage } from "./index/indexPage.js";
import { initProjectPage } from "./project/project.js";
import { init404Gallery } from "./404/404Gallery.js";
import { initPageTransition } from "./transition/pageTransition.js";

const pageInitializers = {
  home: initHomeHero,
  index: initIndexPage,
  project: initProjectPage,
  "not-found": init404Gallery,
};

let activePageApi = null;
let cleanupFns = [];

const getContainerNamespace = (container) => container?.dataset.barbaNamespace || "default";

const destroyCurrentPage = () => {
  while (cleanupFns.length) {
    const cleanup = cleanupFns.pop();

    try {
      cleanup?.();
    } catch (error) {
      console.error("Page cleanup failed", error);
    }
  }

  activePageApi = null;
};

const mountPage = (container) => {
  const namespace = getContainerNamespace(container);
  const siteUiCleanup = initSiteUI(container);
  cleanupFns.push(siteUiCleanup);

  const pageInitializer = pageInitializers[namespace];

  if (!pageInitializer) {
    activePageApi = null;
    return null;
  }

  const pageApi = pageInitializer(container);
  activePageApi = pageApi || null;

  if (typeof pageApi === "function") {
    cleanupFns.push(pageApi);
  } else if (pageApi?.destroy) {
    cleanupFns.push(() => pageApi.destroy());
  }

  return activePageApi;
};

const initialContainer = document.querySelector('[data-barba="container"]');
const initialNamespace = getContainerNamespace(initialContainer);
const initialPageApi = mountPage(initialContainer);

if (
  initialNamespace === "home" &&
  window.location.hash === "#home-reveal" &&
  initialPageApi &&
  typeof initialPageApi.reveal === "function"
) {
  initialPageApi.reveal();
}

initPageTransition({
  mountPage,
  destroyCurrentPage,
  getActivePageApi: () => activePageApi,
});
