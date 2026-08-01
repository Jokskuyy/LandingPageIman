/**
 * Progressive enhancements for the portfolio.
 * The page remains readable and navigable without these behaviors.
 */

const onReady = (callback) => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback, { once: true });
    return;
  }
  callback();
};

onReady(() => {
  const prefersReducedMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const revealItems = [...document.querySelectorAll(".reveal")];

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  const buildLinks = [...document.querySelectorAll("[data-build-link]")];
  const buildCards = [...document.querySelectorAll("[data-build]")];

  const setActiveBuild = (buildId) => {
    buildLinks.forEach((link) => {
      if (link.dataset.buildLink === buildId) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  if ("IntersectionObserver" in window && buildCards.length > 0) {
    const buildObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) setActiveBuild(visible.target.dataset.build);
      },
      { threshold: [0.2, 0.45, 0.7], rootMargin: "-18% 0px -48% 0px" },
    );

    buildCards.forEach((card) => buildObserver.observe(card));
  }

  const sectionLinks = [...document.querySelectorAll("header .nav-link")];
  const sections = sectionLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  const observedSections = [document.querySelector("#hero"), ...sections].filter(
    Boolean,
  );
  const scrollCompanion = document.querySelector("[data-scroll-companion]");
  const companionStatus = document.querySelector("[data-companion-status]");
  const companionLabels = {
    hero: "ONLINE",
    about: "PROFILE",
    experience: "ROUTE",
    skills: "STACK",
    projects: "BUILDS",
    contact: "PING",
  };
  let companionTimer;

  const setCompanionState = (sectionId) => {
    const label = companionLabels[sectionId];
    if (!label || !scrollCompanion || !companionStatus) return;

    scrollCompanion.dataset.state = label;
    if (companionStatus.textContent === label) return;

    companionStatus.textContent = label;
    if (prefersReducedMotion) return;

    scrollCompanion.classList.remove("is-switching");
    scrollCompanion.classList.add("is-switching");
    window.clearTimeout(companionTimer);
    companionTimer = window.setTimeout(() => {
      scrollCompanion.classList.remove("is-switching");
    }, 180);
  };

  if ("IntersectionObserver" in window && observedSections.length > 0) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;
        setCompanionState(visible.target.id);
        sectionLinks.forEach((link) => {
          if (link.getAttribute("href") === `#${visible.target.id}`) {
            link.setAttribute("aria-current", "location");
          } else {
            link.removeAttribute("aria-current");
          }
        });
      },
      { threshold: 0, rootMargin: "-20% 0px -70% 0px" },
    );

    observedSections.forEach((section) => sectionObserver.observe(section));
  }

  const mobileMenu = document.querySelector("header details");
  mobileMenu?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.open = false;
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mobileMenu?.open) {
      mobileMenu.open = false;
      mobileMenu.querySelector("summary")?.focus();
    }
  });

  const copyButton = document.querySelector("#copy-email");
  const copyStatus = document.querySelector("#copy-status");

  const copyWithFallback = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const temporaryField = document.createElement("textarea");
    temporaryField.value = text;
    temporaryField.setAttribute("readonly", "");
    temporaryField.style.position = "fixed";
    temporaryField.style.opacity = "0";
    document.body.append(temporaryField);
    temporaryField.select();
    const copied = document.execCommand("copy");
    temporaryField.remove();

    if (!copied) throw new Error("Clipboard command was rejected");
  };

  copyButton?.addEventListener("click", async () => {
    const email = copyButton.dataset.email;
    if (!email || !copyStatus) return;

    try {
      await copyWithFallback(email);
      copyStatus.textContent = "Email address copied.";
    } catch {
      copyStatus.textContent = "Copy failed. Select the visible email address instead.";
    }
  });
});
