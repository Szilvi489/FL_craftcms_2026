const navToggle = document.querySelector(".site-nav__toggle");
const navPanel = document.querySelector(".site-nav__panel");
const navLabel = document.querySelector(".site-nav__label");
const navKinetic = document.querySelector(".site-nav__kinetic");

if (navToggle && navPanel && navLabel) {
  let kineticCleanupTimer;

  const setOpen = (open) => {
    navToggle.setAttribute("aria-expanded", String(open));
    navPanel.hidden = !open;
    navLabel.textContent = open ? navLabel.dataset.openLabel : navLabel.dataset.closedLabel;
    document.body.classList.toggle("nav-is-open", open);

    if (!open && navKinetic) {
      navKinetic.replaceChildren();
    }
  };

  const runKineticText = (link) => {
    if (!navKinetic || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    window.clearTimeout(kineticCleanupTimer);
    navKinetic.replaceChildren();

    const run = document.createElement("div");
    run.className = "site-nav__kinetic-run";

    const word = (link.dataset.kinetic || link.textContent).trim().toUpperCase();
    const repeatedText = Array.from({ length: 6 }, () => word).join("");

    for (let index = 0; index < 10; index += 1) {
      const line = document.createElement("div");
      line.className = "site-nav__kinetic-line";
      line.textContent = repeatedText;
      line.style.animationDelay = `${index * 45}ms`;
      run.appendChild(line);
    }

    navKinetic.appendChild(run);
    kineticCleanupTimer = window.setTimeout(() => {
      run.remove();
    }, 2200);
  };

  navToggle.addEventListener("click", () => {
    setOpen(navToggle.getAttribute("aria-expanded") !== "true");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setOpen(false);
    }
  });

  navPanel.addEventListener("click", (event) => {
    if (event.target.matches("a")) {
      setOpen(false);
    }
  });

  navPanel.querySelectorAll(".site-nav__inner a").forEach((link) => {
    const hoverClass = `is-hovering-${link.getAttribute("href").replace("/", "")}`;

    link.addEventListener("pointerenter", () => {
      navPanel.classList.remove("is-hovering-projects", "is-hovering-info", "is-hovering-about", "is-hovering-contact");
      navPanel.classList.add(hoverClass);
    });

    link.addEventListener("pointerleave", () => {
      navPanel.classList.remove(hoverClass);
    });

    link.addEventListener("focus", () => {
      navPanel.classList.remove("is-hovering-projects", "is-hovering-info", "is-hovering-about", "is-hovering-contact");
      navPanel.classList.add(hoverClass);
    });

    link.addEventListener("blur", () => {
      navPanel.classList.remove(hoverClass);
    });

    link.addEventListener("pointerenter", () => runKineticText(link));
    link.addEventListener("mouseover", () => runKineticText(link));
    link.addEventListener("focus", () => runKineticText(link));
  });
}
