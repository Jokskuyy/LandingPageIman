/** Navigation, project gallery and clipboard enhancements. Content stays visible without JavaScript. */
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

onReady(() => {
  const nav = document.querySelector('.project-nav');
  const links = [...(nav?.querySelectorAll('[data-build-link]') || [])];
  const panels = links.map(link => document.getElementById(link.dataset.buildLink));
  if (!nav || !links.length || panels.some(panel => !panel)) return;

  const status = document.getElementById('project-status');
  const selectProject = (index, updateHash = false, announce = false) => {
    panels.forEach((panel, i) => {
      panel.hidden = i !== index;
      links[i].setAttribute('aria-selected', String(i === index));
      links[i].tabIndex = i === index ? 0 : -1;
    });
    if (updateHash) history.replaceState(history.state, '', links[index].hash);
    if (announce && status) status.textContent = `Showing ${panels[index].querySelector('h3').textContent}.`;
  };

  nav.setAttribute('role', 'tablist');
  links.forEach((link, index) => {
    link.setAttribute('role', 'tab');
    link.setAttribute('aria-controls', panels[index].id);
    panels[index].setAttribute('role', 'tabpanel');
    panels[index].setAttribute('aria-labelledby', link.id);
    panels[index].tabIndex = 0;
    link.addEventListener('click', event => {
      // Modified clicks retain native links for opening a project in a new tab.
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      selectProject(index, true, true);
    });
    link.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % links.length;
      else if (event.key === 'ArrowLeft') next = (index + links.length - 1) % links.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = links.length - 1;
      else if (event.key === ' ') next = index;
      else return;
      event.preventDefault();
      selectProject(next, true, true);
      links[next].focus();
    });
  });

  const hashIndex = () => links.findIndex(link => link.hash === location.hash);
  const initial = hashIndex();
  selectProject(initial < 0 ? 0 : initial);
  const scrollToSelected = index => panels[index].scrollIntoView({ block: 'start', behavior: 'instant' });
  if (initial >= 0) requestAnimationFrame(() => scrollToSelected(initial));
  window.addEventListener('hashchange', () => {
    const index = hashIndex();
    if (index < 0) return;
    selectProject(index, false, true);
    scrollToSelected(index);
  });
});
