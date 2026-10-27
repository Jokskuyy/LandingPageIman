import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createOrbitalIntro, INTRO_SESSION_KEY } from '../.scratch/space-cockpit/orbital-intro.js';

function setup({ reduced = false, completed = false, storageUnavailable = false, gated = false, sceneWarmup = false } = {}) {
  const dom = new JSDOM(`<!doctype html><body style="overflow:clip">
    <main id="cockpit"><h1 id="briefing-title" tabindex="-1">Opening</h1><button>Destination</button></main>
    <aside id="already-inert" inert></aside>
    <section id="orbital-intro" hidden><div id="orbital-canvas"></div><div id="orbital-ring"></div>
      <h2 id="orbital-title" tabindex="-1">Orbital Initialization</h2>
      <p id="orbital-status" role="status"></p><p id="orbital-note"></p>
      <button id="orbital-enter" hidden disabled>Enter the Bridge</button>
      <p id="orbital-hint" hidden>Scroll to enter</p></section></body>`, { url: 'https://example.test/cockpit/' });
  const { window } = dom;
  const document = window.document;
  globalThis.document = document;
  let now = 0, next = 1, handoffs = 0, begins = 0, ends = 0, hidden = false, resolveWarmup;
  const frames = new Map(), timers = new Map();
  Object.defineProperty(document, 'hidden', { get: () => hidden });
  Object.defineProperty(document, 'visibilityState', { get: () => hidden ? 'hidden' : 'visible' });
  Object.defineProperty(window.performance, 'now', { value: () => now });
  window.requestAnimationFrame = callback => { const id = next++; frames.set(id, callback); return id; };
  window.cancelAnimationFrame = id => frames.delete(id);
  window.setTimeout = (callback, delay) => { const id = next++; timers.set(id, { at: now + delay, callback }); return id; };
  window.clearTimeout = id => timers.delete(id);
  const media = new window.EventTarget();
  media.matches = reduced;
  window.matchMedia = () => media;
  if (completed) window.sessionStorage.setItem(INTRO_SESSION_KEY, 'complete');
  if (storageUnavailable) Object.defineProperty(window, 'sessionStorage', {
    get() { throw new window.DOMException('Storage disabled', 'SecurityError'); }
  });
  if (gated) document.documentElement.dataset.orbitalGate = 'intro';
  const intro = createOrbitalIntro({ onHandoff() { handoffs++; } });
  const warmup = sceneWarmup ? new Promise(resolve => { resolveWarmup = resolve; }) : undefined;
  const scene = {
    beginIntro(host, state) {
      assert.equal(host.id, 'orbital-canvas');
      assert.equal(state, intro.visual);
      begins++;
      return warmup;
    },
    endIntro() { ends++; }
  };
  // One call delivers one frame, even if the main thread was stalled for seconds.
  function advance(milliseconds) {
    now += milliseconds;
    const scheduled = [...frames.values()];
    frames.clear();
    for (const callback of scheduled) callback(now);
    for (const [id, timer] of [...timers]) if (timer.at <= now) { timers.delete(id); timer.callback(); }
  }
  function playFor(milliseconds, frameTime = 16) {
    for (let remaining = milliseconds; remaining > 0;) {
      const step = Math.min(frameTime, remaining);
      advance(step);
      remaining -= step;
    }
  }
  function setHidden(value) {
    hidden = value;
    document.dispatchEvent(new window.Event('visibilitychange', { bubbles: true }));
  }
  function wheel(deltaY = 120) {
    const event = new window.WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY });
    window.dispatchEvent(event);
    return event;
  }
  return { dom, window, document, intro, scene, advance, playFor, setHidden, resolveWarmup, wheel, media, frames, timers,
    get handoffs() { return handoffs; }, get begins() { return begins; }, get ends() { return ends; } };
}

test('cinematic initialization starts after actual readiness and exits once, quarantining continued wheel input', () => {
  const app = setup();
  app.intro.setScene(app.scene);
  app.intro.setScene(app.scene);
  app.playFor(3000);
  assert.equal(app.document.querySelector('#orbital-status').textContent, 'Preparing Bridge');
  assert.equal(app.document.querySelector('#orbital-enter').disabled, true);
  app.wheel();
  assert.equal(app.document.querySelector('#orbital-intro').dataset.phase, 'preparing');
  app.intro.setReady();
  app.advance(0);
  assert.equal(app.intro.visual.progress, 0);
  assert.equal(app.document.querySelector('#orbital-status').textContent, 'Power Online');
  app.playFor(3000);
  assert.equal(app.document.querySelector('#orbital-status').textContent, 'Bridge Ready');
  assert.equal(app.window.sessionStorage.getItem(INTRO_SESSION_KEY), null);
  app.wheel(-120);
  assert.equal(app.document.querySelector('#orbital-intro').dataset.phase, 'ready');
  app.wheel();
  app.document.querySelector('#orbital-enter').click();
  app.advance(0);
  app.playFor(160);
  assert.equal(app.ends, 1);
  app.playFor(850);
  assert.equal(app.intro.active, false);
  assert.equal(app.intro.locked, true);
  assert.equal(app.handoffs, 1);
  assert.equal(app.begins, 1);
  assert.equal(app.document.querySelector('#orbital-intro'), null);
  assert.equal(app.document.activeElement.id, 'briefing-title');
  assert.equal(app.document.body.style.overflow, 'clip');
  assert.equal(app.document.querySelector('#cockpit').hasAttribute('inert'), false);
  assert.equal(app.document.querySelector('#already-inert').hasAttribute('inert'), true);
  assert.equal(app.window.sessionStorage.getItem(INTRO_SESSION_KEY), 'complete');
  app.advance(340);
  assert.equal(app.wheel().defaultPrevented, true);
  app.advance(340);
  assert.equal(app.intro.locked, true);
  app.advance(10);
  assert.equal(app.intro.locked, false);
  assert.equal(app.wheel().defaultPrevented, false);
  assert.equal(app.frames.size, 0);
  assert.equal(app.timers.size, 0);
  assert.equal(app.ends, 1);
  app.dom.window.close();
});

test('there is no Skip control and entry waits for readiness even without session storage', () => {
  const app = setup({ storageUnavailable: true, reduced: true });
  const enter = app.document.querySelector('#orbital-enter');
  assert.equal(app.document.querySelector('#orbital-skip'), null);
  enter.click();
  app.wheel();
  app.playFor(5000);
  assert.equal(app.handoffs, 0);
  assert.equal(app.intro.active, true);
  app.intro.setScene(app.scene);
  app.intro.setReady();
  app.advance(0);
  app.playFor(180);
  enter.click();
  enter.click();
  app.playFor(120);
  app.intro.setScene(app.scene);
  app.intro.setReady();
  assert.equal(app.handoffs, 1);
  assert.equal(app.begins, 1);
  assert.equal(app.ends, 1);
  assert.equal(app.intro.active, false);
  assert.equal(app.frames.size, 0);
  app.advance(350);
  assert.equal(app.intro.locked, false);
  app.dom.window.close();
});

test('fallback entry returns the renderer once and completed sessions bypass without callbacks', () => {
  const app = setup();
  app.intro.setScene(app.scene);
  app.intro.setReady(true);
  app.advance(0);
  app.playFor(3000);
  assert.match(app.document.querySelector('#orbital-note').textContent, /Recovery controls/);
  app.document.querySelector('#orbital-enter').click();
  app.playFor(1000);
  assert.equal(app.ends, 1);
  assert.equal(app.handoffs, 1);
  app.advance(350);
  app.dom.window.close();
  const revisit = setup({ completed: true });
  revisit.intro.setScene(revisit.scene);
  revisit.intro.setReady();
  assert.equal(revisit.intro.active, false);
  assert.equal(revisit.intro.locked, false);
  assert.equal(revisit.handoffs, 0);
  assert.equal(revisit.begins, 0);
  assert.equal(revisit.frames.size, 0);
  revisit.dom.window.close();
});

test('keyboard focus stays in intro, route keys are blocked, and reduced motion uses a brief reveal', () => {
  const app = setup({ reduced: true });
  assert.equal(app.document.activeElement.id, 'orbital-title');
  const tab = new app.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
  app.document.activeElement.dispatchEvent(tab);
  assert.equal(tab.defaultPrevented, true);
  const pageDown = new app.window.KeyboardEvent('keydown', { key: 'PageDown', bubbles: true, cancelable: true });
  app.document.activeElement.dispatchEvent(pageDown);
  assert.equal(pageDown.defaultPrevented, true);
  app.intro.setScene(app.scene);
  app.intro.setReady();
  app.advance(0);
  app.playFor(180);
  assert.equal(app.document.querySelector('#orbital-intro').dataset.phase, 'ready');
  assert.equal(app.document.activeElement.id, 'orbital-enter');
  for (const shiftKey of [false, true]) {
    const cycle = new app.window.KeyboardEvent('keydown', { key:'Tab', shiftKey, bubbles:true, cancelable:true });
    app.document.activeElement.dispatchEvent(cycle);
    assert.equal(cycle.defaultPrevented, true);
    assert.equal(app.document.activeElement.id, 'orbital-enter');
  }
  app.document.querySelector('#orbital-enter').click();
  app.advance(0);
  app.playFor(120);
  assert.equal(app.handoffs, 1);
  assert.equal(app.ends, 1);
  assert.equal(app.document.activeElement.id, 'briefing-title');
  assert.deepEqual(app.intro.visual, { progress: 1, x: 0, y: 0 });
  app.advance(350);
  app.dom.window.close();
});

test('reduced motion changes during initialization complete the sequence and neutralize parallax', () => {
  const app = setup();
  app.intro.setReady();
  app.advance(0);
  app.playFor(1000);
  const pointer = new app.window.MouseEvent('pointermove', { clientX: 900, clientY: 100, bubbles: true });
  Object.defineProperty(pointer, 'pointerType', { value: 'mouse' });
  app.document.querySelector('#orbital-intro').dispatchEvent(pointer);
  app.advance(16);
  assert.notEqual(app.intro.visual.x, 0);
  app.media.matches = true;
  app.media.dispatchEvent(new app.window.Event('change'));
  app.advance(16);
  assert.equal(app.intro.visual.x, 0);
  assert.equal(app.intro.visual.y, 0);
  app.playFor(180);
  assert.equal(app.document.querySelector('#orbital-intro').dataset.phase, 'ready');
  app.document.querySelector('#orbital-enter').click();
  app.playFor(120);
  app.advance(350);
  app.dom.window.close();
});

test('a forward touch gesture enters once and input guards expire even if its removed target never receives touchend', () => {
  const app = setup();
  app.intro.setReady();
  app.advance(0);
  app.playFor(3000);
  for (const [type, clientY] of [['touchstart', 500], ['touchmove', 420]]) {
    const event = new app.window.Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'touches', { value: [{ clientY }] });
    app.document.querySelector('#orbital-intro').dispatchEvent(event);
    if (type === 'touchmove') assert.equal(event.defaultPrevented, true);
  }
  assert.equal(app.document.querySelector('#orbital-intro').dataset.phase, 'exiting');
  app.advance(0);
  app.playFor(1000);
  assert.equal(app.handoffs, 1);
  app.advance(350);
  assert.equal(app.intro.locked, false);
  assert.equal(app.timers.size, 0);
  app.dom.window.close();
});

test('Ctrl+wheel remains available for browser zoom without entering the bridge', () => {
  const app = setup();
  app.intro.setReady();
  app.advance(0);
  app.playFor(3000);
  const zoom = new app.window.WheelEvent('wheel', { bubbles: true, cancelable: true, ctrlKey: true, deltaY: 120 });
  app.window.dispatchEvent(zoom);
  assert.equal(zoom.defaultPrevented, false);
  assert.equal(app.document.querySelector('#orbital-intro').dataset.phase, 'ready');
  app.document.querySelector('#orbital-enter').click();
  app.playFor(1000);
  app.advance(350);
  app.dom.window.close();
});

test('claiming the pre-module stage gate keeps the intro active until normal entry', () => {
  const app = setup({ gated:true, reduced:true });
  assert.equal(app.document.documentElement.dataset.orbitalGate,undefined);
  assert.equal(app.intro.active,true);
  assert.equal(app.document.querySelector('#orbital-intro').hidden,false);
  assert.equal(app.handoffs,0);
  assert.equal(app.window.sessionStorage.getItem(INTRO_SESSION_KEY),null);
  app.intro.setReady();
  app.advance(0);
  app.playFor(180);
  app.document.querySelector('#orbital-enter').click();
  app.playFor(120);
  assert.equal(app.handoffs,1);
  assert.equal(app.window.sessionStorage.getItem(INTRO_SESSION_KEY),'complete');
  assert.equal(app.document.activeElement.id,'briefing-title');
  assert.equal(app.frames.size,0);
  app.advance(350);
  assert.equal(app.timers.size,0);
  app.dom.window.close();
});

test('preparing the application does not consume the visible cinematic sequence', () => {
  const app = setup();
  try {
    assert.equal(app.document.querySelector('#orbital-status').textContent, 'Preparing Bridge');
    assert.equal(app.document.querySelector('#orbital-intro').dataset.phase, 'preparing');
    app.playFor(1500);
    app.advance(8000);
    assert.equal(app.intro.visual.progress, 0, 'Loading time must not fill the wordmark');
    app.intro.setScene(app.scene);
    app.playFor(500);
    assert.equal(app.intro.visual.progress, 0, 'Scene readiness alone must not start the sequence');
    assert.equal(app.document.querySelector('#orbital-enter').disabled, true);
    app.intro.setReady();
    app.advance(1000);
    assert.equal(app.intro.visual.progress, 0, 'The first ready frame must show the outlined wordmark');
    app.playFor(600);
    assert.ok(Math.abs(app.intro.visual.progress - .2) < .000001);
    assert.equal(app.handoffs, 0);
  } finally { app.dom.window.close(); }
});

test('the sequence awaits the shared scene first paint and starts with an unfilled frame', async () => {
  const app = setup({ sceneWarmup: true });
  try {
    app.intro.setScene(app.scene);
    app.intro.setReady();
    app.playFor(2000);
    assert.equal(app.begins, 1);
    assert.equal(app.intro.visual.progress, 0);
    assert.equal(app.document.querySelector('#orbital-intro').dataset.phase, 'preparing');
    assert.equal(app.document.querySelector('#orbital-status').textContent, 'Preparing Bridge');
    assert.equal(app.document.querySelector('#orbital-enter').disabled, true);
    app.resolveWarmup();
    await Promise.resolve();
    app.advance(1200);
    assert.equal(app.intro.visual.progress, 0, 'Warmup and time before its first delivered frame must not consume the reveal');
    app.playFor(600);
    assert.ok(Math.abs(app.intro.visual.progress - .2) < .000001);
    assert.equal(app.document.querySelector('#orbital-intro').dataset.phase, 'initializing');
    assert.equal(app.handoffs, 0);
  } finally { app.dom.window.close(); }
});

test('a delayed animation frame advances at most 1.7 percentage points instead of skipping the fill', () => {
  const app = setup();
  try {
    app.intro.setScene(app.scene);
    app.intro.setReady();
    app.advance(0);
    app.playFor(320);
    for (const stall of [1400, 5000]) {
      const before = app.intro.visual.progress;
      app.advance(stall);
      const jump = app.intro.visual.progress - before;
      assert.ok(jump > 0 && jump <= 50 / 3000 + .000001, `A stalled frame jumped ${jump * 100} percentage points`);
      assert.equal(app.document.querySelector('#orbital-enter').disabled, true);
    }
    app.playFor(3000);
    assert.equal(app.document.querySelector('#orbital-intro').dataset.phase, 'ready');
    app.document.querySelector('#orbital-enter').click();
    app.playFor(1000);
    app.advance(350);
  } finally { app.dom.window.close(); }
});

test('hidden-tab time is excluded and returning to the tab resumes from the same fill', () => {
  const app = setup();
  try {
    app.intro.setReady();
    app.advance(0);
    app.playFor(800);
    const before = app.intro.visual.progress;
    app.setHidden(true);
    app.advance(10000);
    assert.equal(app.intro.visual.progress, before);
    app.setHidden(false);
    app.advance(0);
    assert.equal(app.intro.visual.progress, before, 'The first visible frame must not catch up hidden time');
    app.playFor(160);
    assert.ok(Math.abs(app.intro.visual.progress - before - 160 / 3000) < .000001);
    assert.equal(app.handoffs, 0);
  } finally { app.dom.window.close(); }
});

test('entry waits for scene warmup, cleans up once and cannot restart after completion', async () => {
  const app = setup({ sceneWarmup: true });
  try {
    app.intro.setScene(app.scene);
    app.intro.setReady();
    app.playFor(500);
    app.document.querySelector('#orbital-enter').click();
    assert.equal(app.ends, 0);
    assert.equal(app.handoffs, 0);
    assert.equal(app.window.sessionStorage.getItem(INTRO_SESSION_KEY), null);
    app.resolveWarmup();
    await Promise.resolve();
    app.advance(0);
    app.playFor(3000);
    app.document.querySelector('#orbital-enter').click();
    app.playFor(1000);
    app.advance(350);
    app.intro.setScene(app.scene);
    app.intro.setReady();
    assert.equal(app.intro.active, false);
    assert.equal(app.intro.locked, false);
    assert.equal(app.document.querySelector('#orbital-intro'), null);
    assert.equal(app.begins, 1);
    assert.equal(app.ends, 1);
    assert.equal(app.handoffs, 1);
    assert.equal(app.frames.size, 0);
    assert.equal(app.timers.size, 0);
  } finally { app.dom.window.close(); }
});

test('a scene arriving after the cinematic has started cannot appear halfway through its reveal', () => {
  const app = setup();
  try {
    app.intro.setReady(true);
    app.advance(0);
    app.playFor(500);
    assert.ok(app.intro.visual.progress > 0);
    app.intro.setScene(app.scene);
    assert.equal(app.begins, 0);
    app.playFor(2500);
    assert.equal(app.document.querySelector('#orbital-intro').dataset.phase, 'ready');
    app.document.querySelector('#orbital-enter').click();
    app.playFor(1000);
    app.advance(350);
    assert.equal(app.ends, 0);
  } finally { app.dom.window.close(); }
});
