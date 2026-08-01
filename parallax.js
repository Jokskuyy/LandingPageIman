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

  if ("IntersectionObserver" in window && sections.length > 0) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;
        sectionLinks.forEach((link) => {
          if (link.getAttribute("href") === `#${visible.target.id}`) {
            link.setAttribute("aria-current", "location");
          } else {
            link.removeAttribute("aria-current");
          }
        });
      },
      { threshold: [0.18, 0.4], rootMargin: "-20% 0px -58% 0px" },
    );

    sections.forEach((section) => sectionObserver.observe(section));
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
