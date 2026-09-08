/** Navigation and clipboard enhancements. Content stays visible without JavaScript. */
const onReady = (callback) => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback, { once: true });
  } else {
    callback();
  }
};

onReady(() => {
  const mobileMenu = document.querySelector(".mobile-menu");
  const menuSummary = mobileMenu?.querySelector("summary");

  mobileMenu?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.open = false;
      // Move keyboard focus to the destination before hiding the focused link.
      const target = document.getElementById(link.hash.slice(1));
      if (!target) return;
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mobileMenu?.open) {
      mobileMenu.open = false;
      menuSummary?.focus();
    }
  });

  document.addEventListener("click", (event) => {
    if (mobileMenu?.open && !mobileMenu.contains(event.target)) {
      mobileMenu.open = false;
    }
  });

  const sectionLinks = [...document.querySelectorAll(".desktop-nav .nav-link")];
  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting)[0];
      if (!visible) return;
      sectionLinks.forEach((link) => {
        if (link.hash === `#${visible.target.id}`) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }, { rootMargin: "-15% 0px -70% 0px", threshold: 0 });
    document.querySelectorAll("main > section[id]").forEach((section) => sectionObserver.observe(section));
  }

  const copyButton = document.querySelector("#copy-email");
  const copyStatus = document.querySelector("#copy-status");
  if (!copyButton || !copyStatus) return;
  copyButton.hidden = false;

  const copyWithFallback = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch {
        // Browser permissions can reject Clipboard API access. Try the legacy path.
      }
    }
    const temporaryField = document.createElement("textarea");
    temporaryField.value = text;
    temporaryField.setAttribute("readonly", "");
    temporaryField.setAttribute("aria-label", "Email address to copy");
    temporaryField.style.position = "fixed";
    temporaryField.style.left = "-9999px";
    const previousFocus = document.activeElement;
    document.body.append(temporaryField);
    temporaryField.select();
    try {
      if (!document.execCommand?.("copy")) throw new Error("Copy rejected");
    } finally {
      temporaryField.remove();
      previousFocus?.focus({ preventScroll: true });
    }
  };

  copyButton.addEventListener("click", async () => {
    const email = copyButton.dataset.email;
    if (!email) return;
    try {
      await copyWithFallback(email);
      copyStatus.textContent = "Email address copied.";
    } catch {
      copyStatus.textContent = "Copy failed. Select the visible email address instead.";
    }
  });
});
