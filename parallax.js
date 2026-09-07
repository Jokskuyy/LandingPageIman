/**
 * Progressive enhancements for the portfolio.
 * The page remains readable and navigable without these behaviors.
 *
 * Creative-lab layer: ambient particle canvas, scroll-linked hero parallax,
 * and a manual motion toggle. Every loop is cancellable and respects
 * prefers-reduced-motion (including runtime changes) and document visibility.
 */

const onReady = (callback) => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback, { once: true });
    return;
  }
  callback();
};

onReady(() => {
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  let prefersReducedMotion = Boolean(reducedMotion?.matches);
  const root = document.documentElement;
  const parallaxLayer = document.querySelector("[data-parallax]");
  const floatArts = [...document.querySelectorAll("[data-float]")];
  const particleCanvas = document.querySelector("#particle-field");
  const motionToggle = document.querySelector("#motion-toggle");
  const motionToggleLabel = motionToggle?.querySelector(".motion-toggle-label");

  /* ---------- state machine ---------- */
  // paused = user toggle OR reduced-motion OR hidden tab.
  let paused = prefersReducedMotion;
  let running = false;
  let rafId = 0;

  const syncRootState = () => {
    root.dataset.motion = paused ? "paused" : "on";
    if (motionToggle) {
      motionToggle.setAttribute("aria-pressed", String(paused));
      if (motionToggleLabel) {
        motionToggleLabel.textContent = paused ? "Motion: Off" : "Motion: On";
      }
    }
  };

  const resetMotion = () => {
    if (parallaxLayer) parallaxLayer.style.setProperty("--parallax-y", "0px");
    floatArts.forEach((art) => art.style.setProperty("--float-y", "0px"));
    drawParticles(performance.now(), true);
  };

  /* ---------- particles ---------- */
  const ctx = particleCanvas?.getContext ? particleCanvas.getContext("2d") : null;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let particles = [];
  let mouseX = -9999;
  let mouseY = -9999;

  const PARTICLE_COLORS = [
    "rgba(181, 201, 139, 0.7)",
    "rgba(82, 103, 166, 0.75)",
    "rgba(204, 130, 106, 0.6)",
    "rgba(242, 238, 230, 0.5)",
  ];

  const buildParticles = () => {
    if (!particleCanvas || !ctx) return;
    const rect = particleCanvas.getBoundingClientRect();
    const area = rect.width * rect.height;
    // Bold density: one particle per ~9k px², capped for small screens.
    const count = Math.min(Math.max(Math.round(area / 9000), 40), 150);
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * rect.width,
      y: Math.random() * rect.height,
      radius: 0.9 + Math.random() * 2.1,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
    }));
  };

  const resizeCanvas = () => {
    if (!particleCanvas || !ctx) return;
    const rect = particleCanvas.getBoundingClientRect();
    particleCanvas.width = Math.round(rect.width * dpr);
    particleCanvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildParticles();
  };

  // Advanced canvas APIs (lines) require the full 2D context; the test
  // harness provides a minimal stub, so fall back to dots-only rendering.
  const supportsLines = typeof ctx?.moveTo === "function" && typeof ctx?.stroke === "function";
  const CONSTELLATION_DIST = 110;

  const drawParticles = (time, clearOnly = false) => {
    if (!ctx || !particleCanvas) return;
    const rect = particleCanvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    if (clearOnly || paused || prefersReducedMotion) return;
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -4) p.x = rect.width + 4;
      if (p.x > rect.width + 4) p.x = -4;
      if (p.y < -4) p.y = rect.height + 4;
      if (p.y > rect.height + 4) p.y = -4;
      ctx.globalAlpha = 0.45 + 0.3 * Math.sin(time / 900 + p.x);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Constellation lines between nearby particles.
    if (!supportsLines) return;
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(181, 201, 139, 0.14)";
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        if (dx * dx + dy * dy > CONSTELLATION_DIST * CONSTELLATION_DIST) continue;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
    // Mouse glow: particles near the cursor get pulled slightly toward it.
    if (mouseX > -999) {
      ctx.strokeStyle = "rgba(82, 103, 166, 0.25)";
      for (const p of particles) {
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 150 || dist < 1) continue;
        const pull = 0.06 * (1 - dist / 150);
        p.x += dx * pull * 0.06;
        p.y += dy * pull * 0.06;
        ctx.globalAlpha = 0.5 * (1 - dist / 150);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(mouseX, mouseY);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  };

  /* ---------- scroll parallax + float drift ---------- */
  const MAX_PARALLAX = 48; // px — keeps hero content from drifting out of view
  let latestScroll = window.scrollY;

  const applyMotionFrame = (time) => {
    if (parallaxLayer) {
      const offset = Math.max(-MAX_PARALLAX, Math.min(latestScroll * 0.18, MAX_PARALLAX));
      parallaxLayer.style.setProperty("--parallax-y", `${offset.toFixed(1)}px`);
    }
    floatArts.forEach((art, index) => {
      const wobble = Math.sin(time / (900 + index * 260) + index * 1.7) * 9;
      art.style.setProperty("--float-y", `${wobble.toFixed(2)}px`);
    });
    drawParticles(time);
  };

  const frame = (time) => {
    if (!running) return;
    applyMotionFrame(time);
    rafId = window.requestAnimationFrame(frame);
  };

  const startLoop = () => {
    if (running) return;
    running = true;
    rafId = window.requestAnimationFrame(frame);
  };

  const stopLoop = (reset = true) => {
    running = false;
    if (rafId) window.cancelAnimationFrame(rafId);
    rafId = 0;
    if (reset) resetMotion();
  };

  const refreshLoopState = () => {
    paused = userPaused || prefersReducedMotion || document.hidden;
    syncRootState();
    if (paused || prefersReducedMotion) {
      stopLoop(true);
    } else {
      startLoop();
    }
  };

  let userPaused = false;

  /* ---------- wiring ---------- */
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

  if (particleCanvas && ctx && !prefersReducedMotion) {
    resizeCanvas();
  }

  const onScroll = () => {
    latestScroll = window.scrollY;
    // Single rAF path: scroll only records; the loop applies transforms.
    if (!running && !paused && !prefersReducedMotion) startLoop();
  };

  const onResize = () => {
    if (particleCanvas && ctx && !prefersReducedMotion) resizeCanvas();
    if (!paused && !prefersReducedMotion) applyMotionFrame(performance.now());
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });

  const onPointerMove = (event) => {
    if (!particleCanvas || prefersReducedMotion || paused) return;
    const rect = particleCanvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
  };

  const onPointerLeave = () => {
    mouseX = -9999;
    mouseY = -9999;
  };

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("pointerleave", onPointerLeave);

  reducedMotion?.addEventListener?.("change", () => {
    // Read live state from the MediaQueryList itself: synthetic change events
    // (and some engines) may not carry event.matches.
    prefersReducedMotion = Boolean(reducedMotion.matches);
    if (prefersReducedMotion) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
    }
    refreshLoopState();
  });

  document.addEventListener("visibilitychange", refreshLoopState);

  motionToggle?.addEventListener("click", () => {
    userPaused = !userPaused;
    refreshLoopState();
  });

  // Initial state: exactly one loop when motion is allowed.
  syncRootState();
  if (!paused && !prefersReducedMotion) startLoop();
  else stopLoop(true);

  /* ---------- content behaviors (unchanged) ---------- */
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
