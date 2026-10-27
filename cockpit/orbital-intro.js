export const INTRO_SESSION_KEY = 'iman:orbital-intro:v1';

// The fill is a fictional sequence. Only setReady() reports application readiness.
export function createOrbitalIntro({ onHandoff = () => {} } = {}) {
  const root = document.querySelector('#orbital-intro');
  const view = document.defaultView;
  const visual = { progress: 0, x: 0, y: 0 };
  let active = false, locked = false, ready = false, timelineComplete = false;
  let scene, sceneMounted = false, scenePrepared = true, frame = 0, quietTimer = 0, exitingAt = null;
  let targetX = 0, targetY = 0, lastFrame = null, touchY = null, exitMinimal = false;
  let reduced, effects, guards, cinematicTime = 0, sequenceStarted = false, previousOverflow, inertElements;
  const controller = {
    get active() { return active; },
    get locked() { return locked; },
    visual,
    setReady(fallback = false) {
      if (!active || exitingAt !== null) return;
      ready = true;
      root.querySelector('#orbital-note').textContent = fallback
        ? 'Bridge available. Recovery controls are inside.'
        : 'A cinematic initialization sequence.';
      updateReady();
      scheduleFrame();
    },
    setScene(value) {
      if (!active || exitingAt !== null || scene || sequenceStarted) return;
      scene = value;
      sceneMounted = true;
      const preparation = scene.beginIntro(root.querySelector('#orbital-canvas'), visual);
      if (preparation?.then) {
        scenePrepared = false;
        Promise.resolve(preparation).then(() => {
          scenePrepared = true;
          scheduleFrame();
        }, () => {
          scenePrepared = true;
          scheduleFrame();
        });
      }
    }
  };

  let completed = false;
  try { completed = view.sessionStorage.getItem(INTRO_SESSION_KEY) === 'complete'; } catch {}
  const unavailable = document.documentElement.dataset.orbitalGate === 'unavailable';
  delete document.documentElement.dataset.orbitalGate;
  document.dispatchEvent(new view.Event('orbital:claimed'));
  if (!root || completed || unavailable) {
    root?.remove();
    return controller;
  }

  const status = root.querySelector('#orbital-status');
  const enter = root.querySelector('#orbital-enter');
  const hint = root.querySelector('#orbital-hint');
  const ring = root.querySelector('#orbital-ring');
  reduced = view.matchMedia('(prefers-reduced-motion: reduce)');
  effects = new view.AbortController();
  guards = new view.AbortController();
  previousOverflow = document.body.style.overflow;
  inertElements = [...document.body.children].filter(element => element !== root)
    .map(element => [element, element.hasAttribute('inert')]);
  for (const [element] of inertElements) element.setAttribute('inert', '');
  document.body.style.overflow = 'hidden';
  document.body.dataset.intro = 'active';
  root.hidden = false;
  root.dataset.phase = 'preparing';
  enter.hidden = true;
  enter.disabled = true;
  hint.hidden = true;
  active = locked = true;
  root.querySelector('#orbital-title').focus({ preventScroll: true });

  function announce(message) {
    if (status.textContent !== message) status.textContent = message;
  }
  function updateReady() {
    if (!timelineComplete || !ready || exitingAt !== null) return;
    root.dataset.phase = 'ready';
    enter.hidden = false;
    enter.disabled = false;
    hint.hidden = false;
    announce('Bridge Ready');
    if (root.contains(document.activeElement)) enter.focus({ preventScroll: true });
  }
  function scheduleFrame() {
    if (active && !frame) frame = view.requestAnimationFrame(draw);
  }
  function endScene() {
    if (!sceneMounted) return;
    sceneMounted = false;
    scene.endIntro();
  }
  function releaseAfterQuiet() {
    view.clearTimeout(quietTimer);
    if (active) return;
    quietTimer = view.setTimeout(() => {
      locked = false;
      guards.abort();
      quietTimer = 0;
    }, 350);
  }
  function handoff() {
    if (!active) return;
    endScene();
    active = false;
    effects.abort();
    view.cancelAnimationFrame(frame);
    frame = 0;
    document.body.style.overflow = previousOverflow;
    delete document.body.dataset.intro;
    for (const [element, wasInert] of inertElements) {
      if (!wasInert) element.removeAttribute('inert');
    }
    root.remove();
    try {
      onHandoff();
      try { view.sessionStorage.setItem(INTRO_SESSION_KEY, 'complete'); } catch {}
    } finally {
      document.querySelector('#briefing-title')?.focus({ preventScroll: true });
      releaseAfterQuiet();
    }
  }
  function startEntry() {
    if (!active || !ready || !timelineComplete || exitingAt !== null) return;
    exitingAt = view.performance.now();
    exitMinimal = reduced.matches;
    root.dataset.phase = 'exiting';
    enter.disabled = true;
    hint.hidden = true;
    targetX = targetY = 0;
    scheduleFrame();
  }
  function draw(time) {
    frame = 0;
    if (!active) return;
    if (exitingAt !== null && reduced.matches) exitMinimal = true;
    const minimal = reduced.matches || exitMinimal;
    if (exitingAt !== null) {
      const duration = minimal ? 120 : 1000;
      const elapsed = time - exitingAt;
      const fade = minimal ? 0 : 140;
      if (elapsed >= fade) endScene();
      const amount = Math.max(0, Math.min(1, (elapsed - fade) / (duration - fade)));
      if (minimal) root.style.opacity = String(1 - amount);
      else {
        const eased = 1 - (1 - amount) ** 3;
        const radius = Math.hypot(view.innerWidth * .5, view.innerHeight * .54) + 8;
        const ringRadius = ring.clientWidth / 2
          || Math.min(view.innerWidth * .68, view.innerHeight * .72) / 2;
        root.style.setProperty('--orb-aperture', `${radius * eased}px`);
        root.style.setProperty('--orb-ring-scale', String(1 + (radius / ringRadius - 1) * eased));
      }
      if (elapsed >= duration) handoff();
      else scheduleFrame();
      return;
    }

    // Initialization, shader/texture warmup and hidden-tab time are outside
    // the cinematic clock. Visitors should see the complete fill/reveal.
    if (!ready || !scenePrepared || document.hidden) {
      lastFrame = null;
      return;
    }
    if (!sequenceStarted) {
      sequenceStarted = true;
      root.dataset.phase = 'initializing';
    }
    if (!timelineComplete) {
      // A blocked main thread must not turn one presented frame into a cut.
      cinematicTime += lastFrame !== null ? Math.max(0,Math.min(time-lastFrame,50)) : 0;
      visual.progress = Math.min(1, cinematicTime / (minimal ? 180 : 3000));
      root.style.setProperty('--orb-fill', `${visual.progress * 100}%`);
      root.style.setProperty('--orb-light', String(.12 + visual.progress * .88));
      announce(visual.progress < .32 ? 'Power Online'
        : visual.progress < .72 ? 'Navigation Synced' : 'Preparing Bridge');
      timelineComplete = visual.progress === 1;
      updateReady();
    }
    const smoothing = 1 - Math.exp(-8 * (lastFrame !== null ? Math.min((time - lastFrame) / 1000, .05) : 1 / 60));
    lastFrame = time;
    if (minimal) targetX = targetY = visual.x = visual.y = 0;
    visual.x += (targetX - visual.x) * smoothing;
    visual.y += (targetY - visual.y) * smoothing;
    root.style.setProperty('--orb-x', `${visual.x * 14}px`);
    root.style.setProperty('--orb-y', `${visual.y * 10}px`);
    if (!timelineComplete || Math.abs(targetX - visual.x) > .001 || Math.abs(targetY - visual.y) > .001) scheduleFrame();
    else lastFrame = null;
  }

  enter.addEventListener('click', startEntry, { signal: effects.signal });
  root.addEventListener('pointermove', event => {
    if (reduced.matches || event.pointerType !== 'mouse' || exitingAt !== null) return;
    targetX = Math.max(-1, Math.min(1, event.clientX / view.innerWidth * 2 - 1));
    targetY = Math.max(-1, Math.min(1, event.clientY / view.innerHeight * 2 - 1));
    scheduleFrame();
  }, { signal: effects.signal });
  root.addEventListener('pointerleave', () => {
    targetX = targetY = 0;
    scheduleFrame();
  }, { signal: effects.signal });
  reduced.addEventListener('change', () => {
    if (reduced.matches) targetX = targetY = 0;
    scheduleFrame();
  }, { signal: effects.signal });
  document.addEventListener('visibilitychange', () => {
    lastFrame = null;
    if (!document.hidden) scheduleFrame();
  }, { signal: effects.signal });

  // Keep the input that enters (including trackpad momentum) out of the journey.
  view.addEventListener('wheel', event => {
    if (!locked || event.ctrlKey) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.deltaY > 0) startEntry();
    releaseAfterQuiet();
  }, { capture: true, passive: false, signal: guards.signal });
  view.addEventListener('touchstart', event => {
    if (!locked) return;
    touchY = event.touches[0]?.clientY ?? null;
    releaseAfterQuiet();
  }, { capture: true, passive: true, signal: guards.signal });
  view.addEventListener('touchmove', event => {
    if (!locked) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (touchY !== null && touchY - (event.touches[0]?.clientY ?? touchY) > 24) startEntry();
    releaseAfterQuiet();
  }, { capture: true, passive: false, signal: guards.signal });
  for (const type of ['touchend', 'touchcancel']) view.addEventListener(type, () => {
    touchY = null;
    releaseAfterQuiet();
  }, { capture: true, passive: true, signal: guards.signal });
  view.addEventListener('blur', () => {
    touchY = null;
    releaseAfterQuiet();
  }, { signal: guards.signal });
  view.addEventListener('keydown', event => {
    if (!locked) return;
    const routeKeys = ['PageDown', 'PageUp', 'Home', 'End', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', ' '];
    const controls = [enter].filter(button => !button.hidden && !button.disabled);
    if (active) {
      event.stopImmediatePropagation();
      if (event.key === 'Tab') {
        const current = controls.indexOf(document.activeElement);
        if (current < 0 || (event.shiftKey ? current === 0 : current === controls.length - 1)) {
          event.preventDefault();
          controls[event.shiftKey ? controls.length - 1 : 0]?.focus({ preventScroll: true });
        }
      }
    }
    if (routeKeys.includes(event.key) && !(active && event.key === ' ' && controls.includes(event.target))) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, { capture: true, signal: guards.signal });
  announce('Preparing Bridge');
  scheduleFrame();
  return controller;
}
