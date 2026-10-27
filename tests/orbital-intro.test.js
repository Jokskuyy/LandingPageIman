import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createOrbitalIntro, INTRO_SESSION_KEY } from '../.scratch/space-cockpit/orbital-intro.js';

function setup({ reduced = false, completed = false, storageUnavailable = false, skippedEarly = false } = {}) {
  const dom = new JSDOM(`<!doctype html><body style="overflow:clip">
    <main id="cockpit"><h1 id="briefing-title" tabindex="-1">Opening</h1><button>Destination</button></main>
    <aside id="already-inert" inert></aside>
    <section id="orbital-intro" hidden><div id="orbital-canvas"></div><div id="orbital-ring"></div>
      <p id="orbital-status" role="status"></p><p id="orbital-note"></p>
      <button id="orbital-skip">Skip Intro</button><button id="orbital-enter" hidden disabled>Enter the Bridge</button>
      <p id="orbital-hint" hidden>Scroll to enter</p></section></body>`, { url: 'https://example.test/cockpit/' });
  const { window } = dom;
  const document = window.document;
  globalThis.document = document;
  let now = 0, next = 1, handoffs = 0, begins = 0, ends = 0;
  const frames = new Map(), timers = new Map();
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
  if (skippedEarly) document.documentElement.dataset.orbitalGate = 'skipped';
  const intro = createOrbitalIntro({ onHandoff() { handoffs++; } });
  const scene = {
    beginIntro(host, state) { assert.equal(host.id, 'orbital-canvas'); assert.equal(state, intro.visual); begins++; },
    endIntro() { ends++; }
  };
  function advance(milliseconds) {
    now += milliseconds;
    const scheduled = [...frames.values()];
    frames.clear();
    for (const callback of scheduled) callback(now);
    for (const [id, timer] of [...timers]) if (timer.at <= now) { timers.delete(id); timer.callback(); }
  }
  function wheel(deltaY = 120) {
    const event = new window.WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY });
    window.dispatchEvent(event);
    return event;
  }
  return { dom, window, document, intro, scene, advance, wheel, media, frames, timers,
    get handoffs() { return handoffs; }, get begins() { return begins; }, get ends() { return ends; } };
}

test('cinematic completion waits for actual readiness and exits once, quarantining continued wheel input', () => {
  const app = setup();
  app.intro.setScene(app.scene);
  app.intro.setScene(app.scene);
  app.advance(3000);
  assert.equal(app.document.querySelector('#orbital-status').textContent, 'Preparing Bridge');
  assert.equal(app.document.querySelector('#orbital-enter').disabled, true);
  app.wheel();
  assert.equal(app.document.querySelector('#orbital-intro').dataset.phase, 'initializing');
  app.intro.setReady();
  assert.equal(app.document.querySelector('#orbital-status').textContent, 'Bridge Ready');
  app.wheel(-120);
  assert.equal(app.document.querySelector('#orbital-intro').dataset.phase, 'ready');
  app.wheel();
  app.document.querySelector('#orbital-enter').click();
  app.advance(140);
  assert.equal(app.ends, 1);
  app.advance(860);
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

test('skip immediately reveals preparing content, remains functional without storage, and ignores late readiness or scenes', () => {
  const app = setup({ storageUnavailable: true });
  const skip = app.document.querySelector('#orbital-skip');
  skip.click();
  skip.click();
  app.intro.setScene(app.scene);
  app.intro.setReady();
  assert.equal(app.handoffs, 1);
  assert.equal(app.begins, 0);
  assert.equal(app.intro.active, false);
  assert.equal(app.frames.size, 0);
  app.advance(350);
  assert.equal(app.intro.locked, false);
  app.dom.window.close();
});

test('skip after readiness returns the renderer once and completed sessions bypass without callbacks', () => {
  const app = setup();
  app.intro.setScene(app.scene);
  app.intro.setReady(true);
  app.advance(3000);
  assert.match(app.document.querySelector('#orbital-note').textContent, /Recovery controls/);
  app.document.querySelector('#orbital-skip').click();
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
  assert.equal(app.document.activeElement.id, 'orbital-skip');
  const tab = new app.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
  app.document.activeElement.dispatchEvent(tab);
  assert.equal(tab.defaultPrevented, true);
  const pageDown = new app.window.KeyboardEvent('keydown', { key: 'PageDown', bubbles: true, cancelable: true });
  app.document.activeElement.dispatchEvent(pageDown);
  assert.equal(pageDown.defaultPrevented, true);
  app.intro.setScene(app.scene);
  app.intro.setReady();
  app.advance(180);
  assert.equal(app.document.querySelector('#orbital-intro').dataset.phase, 'ready');
  app.document.querySelector('#orbital-enter').click();
  app.advance(120);
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
  app.advance(1000);
  const pointer = new app.window.MouseEvent('pointermove', { clientX: 900, clientY: 100, bubbles: true });
  Object.defineProperty(pointer, 'pointerType', { value: 'mouse' });
  app.document.querySelector('#orbital-intro').dispatchEvent(pointer);
  app.advance(16);
  assert.notEqual(app.intro.visual.x, 0);
  app.media.matches = true;
  app.media.dispatchEvent(new app.window.Event('change'));
  app.advance(16);
  assert.equal(app.document.querySelector('#orbital-intro').dataset.phase, 'ready');
  assert.equal(app.intro.visual.x, 0);
  assert.equal(app.intro.visual.y, 0);
  app.document.querySelector('#orbital-skip').click();
  app.advance(350);
  app.dom.window.close();
});

test('a forward touch gesture enters once and input guards expire even if its removed target never receives touchend', () => {
  const app = setup();
  app.intro.setReady();
  app.advance(3000);
  for (const [type, clientY] of [['touchstart', 500], ['touchmove', 420]]) {
    const event = new app.window.Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'touches', { value: [{ clientY }] });
    app.document.querySelector('#orbital-intro').dispatchEvent(event);
    if (type === 'touchmove') assert.equal(event.defaultPrevented, true);
  }
  assert.equal(app.document.querySelector('#orbital-intro').dataset.phase, 'exiting');
  app.advance(1000);
  assert.equal(app.handoffs, 1);
  app.advance(350);
  assert.equal(app.intro.locked, false);
  assert.equal(app.timers.size, 0);
  app.dom.window.close();
});

test('Ctrl+wheel remains available for browser zoom without entering the bridge', () => {
  const app = setup();
  app.intro.setReady();
  app.advance(3000);
  const zoom = new app.window.WheelEvent('wheel', { bubbles: true, cancelable: true, ctrlKey: true, deltaY: 120 });
  app.window.dispatchEvent(zoom);
  assert.equal(zoom.defaultPrevented, false);
  assert.equal(app.document.querySelector('#orbital-intro').dataset.phase, 'ready');
  app.document.querySelector('#orbital-skip').click();
  app.advance(350);
  app.dom.window.close();
});

test('an early Skip is committed only after the real app claims the stage', async () => {
  const app = setup({ skippedEarly:true });
  assert.equal(app.document.documentElement.dataset.orbitalGate,undefined);
  assert.equal(app.intro.active,false);
  assert.equal(app.document.querySelector('#orbital-intro'),null);
  assert.equal(app.handoffs,0);
  assert.equal(app.window.sessionStorage.getItem(INTRO_SESSION_KEY),null);
  await Promise.resolve();
  assert.equal(app.handoffs,1);
  assert.equal(app.window.sessionStorage.getItem(INTRO_SESSION_KEY),'complete');
  assert.equal(app.document.activeElement.id,'briefing-title');
  assert.equal(app.frames.size,0);
  assert.equal(app.timers.size,0);
  app.dom.window.close();
});
