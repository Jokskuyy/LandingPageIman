// Run against the packaged /cockpit/ route with playwright-cli run-code --filename.
async (page) => {
  const base = new URL('.', page.url()).href;
  const sessionKey = 'iman:orbital-intro:v1';
  const results = [], errors = [];
  let scenario = '';
  const check = (value, message) => { if (!value) throw new Error(message); };
  const fresh = async ({ reduced = false, storage = true } = {}) => {
    const tab = await page.context().newPage();
    await tab.setViewportSize({ width:1440, height:900 });
    await tab.emulateMedia({ reducedMotion:reduced ? 'reduce' : 'no-preference' });
    await tab.addInitScript(({ storage, sessionKey }) => {
      window.__introSignals = [];
      window.__contexts = new Set();
      window.__completionWrites = 0;
      const add = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function(type, callback, options) {
        if (options?.signal && (this === window || this.id?.startsWith('orbital-'))) window.__introSignals.push(options.signal);
        return add.call(this,type,callback,options);
      };
      const context = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, ...args) {
        const result = context.call(this,type,...args);
        if (/^webgl/.test(type) && result) window.__contexts.add(result);
        return result;
      };
      const write = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key,value) {
        if (key === sessionKey) window.__completionWrites++;
        return write.call(this,key,value);
      };
      if (!storage) Object.defineProperty(window,'sessionStorage', {
        get() { throw new DOMException('Storage disabled for resilience check','SecurityError'); }
      });
    }, { storage, sessionKey });
    tab.on('pageerror', error => errors.push({ scenario, type:'exception', message:error.message }));
    tab.on('console', message => {
      if (['error','warning'].includes(message.type())) errors.push({ scenario, type:message.type(), message:message.text() });
    });
    return tab;
  };
  const ready = tab => tab.waitForFunction(() => document.querySelector('#orbital-intro')?.dataset.phase === 'ready');
  const gone = tab => tab.locator('#orbital-intro').waitFor({ state:'detached' });
  const cleaned = async tab => {
    await tab.waitForFunction(() => window.__introSignals.every(signal => signal.aborted));
    check(await tab.locator('#orbital-intro').count() === 0,'Finished overlay remains');
    check(await tab.evaluate(() => !document.querySelector('[inert]') && document.body.style.overflow === ''),'Input isolation not restored');
  };
  const run = async (name, fn, options) => {
    scenario = name;
    const tab = await fresh(options), start = Date.now();
    try { await fn(tab); results.push({ name, pass:true, durationMs:Date.now()-start }); }
    catch (error) { throw new Error(`${name}: ${error.message}`); }
    finally { await tab.close(); }
  };

  await run('first visit, keyboard entry, focus, parallax, one context, session reload', async tab => {
    await tab.goto(base,{ waitUntil:'domcontentloaded' });
    check(await tab.locator('#orbital-enter').isHidden(),'Entry enabled before timeline');
    check(await tab.locator('#cockpit').getAttribute('inert') !== null,'Cockpit must be inert');
    check(await tab.locator('.guide').evaluate(node => getComputedStyle(node).visibility) === 'hidden','Guide visible during intro');
    check(await tab.locator('#destination-announcement').textContent() === '','Underlying destination announced too early');
    await tab.keyboard.press('PageDown');
    check(await tab.evaluate(() => scrollY) === 0,'Keyboard advanced route during intro');
    await ready(tab);
    check(await tab.evaluate(() => window.__contexts.size) === 1,'Intro initialized a second WebGL context');
    check(await tab.locator('#orbital-intro [role="progressbar"]').count() === 0,'Fictional sequence presented as measured loading');
    const buttonBefore = await tab.locator('#orbital-enter').boundingBox();
    await tab.mouse.move(1390,80);
    await tab.waitForFunction(() => parseFloat(document.querySelector('#orbital-intro').style.getPropertyValue('--orb-x')) > 8);
    const buttonAfter = await tab.locator('#orbital-enter').boundingBox();
    check(buttonBefore.x === buttonAfter.x && buttonBefore.y === buttonAfter.y,'Pointer parallax moves essential control');
    await tab.mouse.move(-5,-5);
    await tab.waitForFunction(() => Math.abs(parseFloat(document.querySelector('#orbital-intro').style.getPropertyValue('--orb-x'))) < .1);
    await tab.screenshot({ path:'tmp/cockpit-preview/orbital-ready-desktop.png' });
    await tab.locator('#orbital-skip').focus();
    check(await tab.locator('#orbital-skip').evaluate(node => getComputedStyle(node).outlineStyle) !== 'none','Keyboard focus is invisible');
    await tab.keyboard.press('Tab');
    check(await tab.locator('#orbital-enter').evaluate(node => node === document.activeElement),'Tab order misses entry');
    await tab.keyboard.press('Enter');
    await gone(tab);
    check(await tab.evaluate(() => document.activeElement.id) === 'briefing-title','Handoff lost keyboard focus');
    check(await tab.locator('#route-percent').innerText() === '0%','Entry advanced route');
    check(await tab.locator('#guide-dialogue').innerText() === 'Captain, welcome aboard. Navigation is ready.','Welcome not coordinated with handoff');
    check(await tab.locator('.guide').isVisible(),'Guide not revealed after handoff');
    await cleaned(tab);
    check(await tab.evaluate(key => sessionStorage.getItem(key),sessionKey) === 'complete','Completion not stored');
    check(await tab.evaluate(() => window.__completionWrites) === 1,'Handoff completed more than once');
    await tab.screenshot({ path:'tmp/cockpit-preview/orbital-bridge-desktop.png' });
    await tab.locator('.destination-nav [data-stop="4"]').click();
    await tab.waitForFunction(() => document.body.dataset.travel === 'holding' && document.querySelector('#route-percent').textContent === '100%');
    await tab.reload();
    await tab.waitForFunction(() => document.querySelector('#window-mode').textContent === '3D ONLINE');
    check(await tab.locator('#orbital-intro').count() === 0,'Completed session replayed intro');
    check(await tab.locator('#route-percent').innerText() === '0%','Reload no longer restarts at Opening');
  });

  await run('forward scroll entry, repeated input, continued trackpad momentum, cleanup', async tab => {
    await tab.goto(base); await ready(tab);
    await tab.mouse.move(760,430);
    await tab.mouse.wheel(0,180);
    for (let i=0;i<14;i++) {
      await tab.mouse.wheel(0,90);
      await tab.waitForTimeout(100);
      if (i === 2) await tab.screenshot({path:'tmp/cockpit-preview/orbital-window-reveal.png'});
      check(await tab.evaluate(() => scrollY) === 0,'Momentum advanced journey during handoff');
    }
    await gone(tab);
    check(await tab.evaluate(() => window.__completionWrites) === 1,'Repeated input completed twice');
    await cleaned(tab);
    check(await tab.locator('#route-percent').innerText() === '0%','Momentum skipped Opening');
    await tab.mouse.wheel(0,700);
    await tab.waitForFunction(() => scrollY > 0);
  });

  await run('Skip during preparation, late initialization, no duplicate intro', async tab => {
    let pending;
    await tab.route('**/vendor/three/three.module.js', route => { pending=route; });
    await tab.goto(base,{ waitUntil:'domcontentloaded' });
    await tab.locator('#orbital-skip').click(); await gone(tab);
    check(await tab.locator('#scene-status').isVisible(),'Skip hides actual preparing state');
    check((await tab.locator('#window-mode').textContent()) !== '3D ONLINE','Skip falsely marks scene ready');
    await pending.continue();
    await tab.waitForFunction(() => document.querySelector('#window-mode').textContent === '3D ONLINE');
    await cleaned(tab);
    check(await tab.locator('#guide-dialogue').innerText() === 'Captain, welcome aboard. Navigation is ready.','Late archive refresh erased welcome');
    check(await tab.locator('#orbital-intro').count() === 0,'Late initialization reopened intro');
    check(await tab.evaluate(() => window.__contexts.size) === 1,'Late initialization created duplicate contexts');
  });

  await run('slow scene waits beyond cinematic timeline, deadline fallback, late recovery', async tab => {
    let pending;
    await tab.route('**/vendor/three/three.module.js', route => { pending=route; });
    await tab.goto(base,{ waitUntil:'domcontentloaded' });
    await tab.waitForTimeout(3300);
    check(await tab.locator('#orbital-status').innerText() === 'Preparing Bridge','Timeline falsely announces readiness');
    check(await tab.locator('#orbital-enter').isHidden(),'Entry allowed before actual scene/fallback');
    await ready(tab);
    check(await tab.locator('#cockpit').evaluate(node => node.inert),'Fallback controls are operable behind intro');
    check(await tab.locator('#window-mode').textContent() === 'TEXT VIEW','Stalled import has no fallback');
    await tab.locator('#orbital-enter').click(); await gone(tab); await cleaned(tab);
    check(await tab.locator('#retry-scene').isVisible(),'Fallback does not offer Retry 3D');
    await pending.continue();
    await tab.waitForFunction(() => document.querySelector('#window-mode').textContent === '3D ONLINE');
    check(await tab.locator('#route-percent').innerText() === '0%','Late scene moved cockpit');
  });

  await run('Skip after ready fallback and Retry 3D preserves station once', async tab => {
    await tab.goto(base+'?scene=off#contact'); await ready(tab);
    check(await tab.locator('#window-mode').textContent() === 'TEXT VIEW','Failure was not handled');
    await tab.locator('#orbital-skip').click(); await gone(tab); await cleaned(tab);
    check(await tab.locator('#route-percent').innerText() === '100%','Skip lost deliberate deep link');
    await tab.locator('#retry-scene').click();
    await tab.waitForFunction(() => document.querySelector('#window-mode').textContent === '3D ONLINE');
    check(await tab.locator('#route-percent').innerText() === '100%','Retry 3D lost station');
    check(await tab.locator('#orbital-intro').count() === 0,'Retry replayed completed intro');
    await tab.reload();
    await tab.waitForFunction(() => document.querySelector('#route-percent').textContent === '0%');
  },{ reduced:true });

  await run('unavailable session storage and reduced motion remain functional', async tab => {
    await tab.goto(base); await ready(tab);
    await tab.mouse.move(1360,70);
    check(await tab.locator('#orbital-intro').evaluate(node => parseFloat(node.style.getPropertyValue('--orb-x'))) === 0,'Reduced motion parallax remains active');
    await tab.locator('#orbital-enter').click(); await gone(tab); await cleaned(tab);
    check(await tab.locator('#route-percent').innerText() === '0%','Storage failure broke entry');
    await tab.reload(); await ready(tab);
    await tab.locator('#orbital-skip').click(); await gone(tab); await cleaned(tab);
  },{ reduced:true, storage:false });

  await run('archive timeout, normal fallback, Retry archives recovery', async tab => {
    const source = new URL('../index.html',base).href;
    let pending;
    await tab.route(source, route => { pending=route; });
    await tab.goto(base,{ waitUntil:'domcontentloaded' });
    await tab.waitForTimeout(500);
    check(await tab.locator('#orbital-enter').isHidden(),'Archives did not participate in readiness');
    await ready(tab);
    await tab.locator('#orbital-enter').click(); await gone(tab); await cleaned(tab);
    await tab.locator('.destination-nav [data-stop="1"]').click();
    await tab.locator('[data-retry-source]').waitFor({ state:'visible' });
    await tab.unroute(source);
    await pending.abort().catch(() => {});
    await tab.locator('[data-retry-source]').click();
    await tab.waitForFunction(() => document.querySelectorAll('.project-picks button').length === 4);
    check(await tab.locator('#orbital-intro').count() === 0,'Recovery replayed intro');
  },{ reduced:true });

  await run('interior asset failure is available through existing SVG fallback', async tab => {
    await tab.route('**/assets/cockpit-interior-v1.png',route => route.abort('failed'));
    await tab.goto(base); await ready(tab);
    await tab.locator('#orbital-enter').click(); await gone(tab); await cleaned(tab);
    check(await tab.locator('#cockpit').getAttribute('data-interior') === 'fallback','Interior fallback did not activate');
    check(await tab.locator('.cockpit-frame').isVisible(),'SVG interior unavailable after failure');
  },{ reduced:true });

  await run('cold module delay shows dark intro with working early Skip', async tab => {
    let pending;
    await tab.route('**/orbital-intro.js*', route => { pending=route; });
    await tab.goto(base,{ waitUntil:'commit' });
    await tab.locator('#orbital-skip').waitFor({ state:'visible' });
    check(await tab.locator('#cockpit').evaluate(node => getComputedStyle(node).visibility) === 'hidden','Cockpit flashed before modules arrived');
    check(await tab.locator('.guide').evaluate(node => getComputedStyle(node).visibility) === 'hidden','Guide flashed before intro module');
    await tab.locator('#orbital-skip').click();
    check(await tab.locator('#orbital-intro').isHidden(),'Early Skip depends on optional module');
    check(await tab.locator('.scene-recovery').isVisible(),'Early Skip has no readable fallback');
    check(await tab.evaluate(key => sessionStorage.getItem(key),sessionKey) === null,'Early Skip marked completion before app handoff');
    await pending.continue();
    await gone(tab);
    await tab.waitForFunction(() => document.querySelector('#window-mode').textContent === '3D ONLINE');
    check(await tab.evaluate(key => sessionStorage.getItem(key),sessionKey) === 'complete','Early Skip completion not recorded after app starts');
  });

  await run('deep links survive fast initialization and entry', async tab => {
    await tab.goto(base+'#capabilities'); await ready(tab);
    check(await tab.locator('#route-percent').innerText() === '50%','Cold deep link overwritten');
    await tab.locator('#orbital-enter').click(); await gone(tab); await cleaned(tab);
    check(await tab.locator('#route-percent').innerText() === '50%','Entry lost deep link');
    await tab.evaluate(key => sessionStorage.removeItem(key),sessionKey);
    await tab.goto(base+'?warm=1#contact'); await ready(tab);
    check(await tab.locator('#route-percent').innerText() === '100%','Warm deep link overwritten');
    await tab.locator('#orbital-enter').click(); await gone(tab); await cleaned(tab);
    check(await tab.locator('#guide-dialogue').innerText() === 'Captain, ready for a new mission? Open a channel.','Deep link dialogue replaced by Opening welcome');
  },{ reduced:true });

  await run('lost WebGL context during intro hands off into normal recovery', async tab => {
    await tab.goto(base); await ready(tab);
    const supported = await tab.locator('#orbital-canvas canvas').evaluate(canvas => {
      const extension = canvas.getContext('webgl2').getExtension('WEBGL_lose_context');
      extension?.loseContext();
      return Boolean(extension);
    });
    check(supported,'WebGL context-loss extension unavailable');
    await tab.waitForFunction(() => document.querySelector('#window-mode').textContent === 'TEXT VIEW');
    await tab.locator('#orbital-enter').click(); await gone(tab); await cleaned(tab);
    check(await tab.locator('#retry-scene').isVisible(),'Context loss trapped visitor without recovery');
    check(await tab.locator('#route-percent').innerText() === '0%','Context loss advanced journey');
  },{reduced:true});

  for (const [width,height] of [[820,1180],[390,844],[844,390]]) await run(`responsive ${width}x${height}`,async tab => {
    await tab.setViewportSize({width,height});
    await tab.goto(base); await ready(tab);
    check(await tab.evaluate(() => document.documentElement.scrollWidth <= innerWidth),'Horizontal overflow');
    for (const selector of ['#orbital-skip','#orbital-status','#orbital-enter','#orbital-hint']) {
      const box = await tab.locator(selector).boundingBox();
      check(box && box.x >= 0 && box.y >= 0 && box.x+box.width <= width && box.y+box.height <= height,`${selector} outside ${width}x${height}`);
    }
    await tab.screenshot({path:`tmp/cockpit-preview/orbital-ready-${width}x${height}.png`});
    await tab.locator('#orbital-enter').click(); await gone(tab); await cleaned(tab);
    check(await tab.locator('#route-percent').innerText() === '0%','Responsive entry advances route');
  },{reduced:true});

  const touchContext = await page.context().browser().newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  try {
    const tab=await touchContext.newPage(), cdp=await touchContext.newCDPSession(tab);
    await tab.goto(base); await ready(tab);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:195,y:520}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:195,y:450}]});
    await tab.waitForTimeout(150);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:195,y:380}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await gone(tab); await tab.waitForTimeout(400);
    check(await tab.locator('#route-percent').innerText() === '0%','Touch entry advanced journey');
    await tab.locator('.destination-nav [data-stop="1"]').tap();
    await tab.waitForFunction(() => document.querySelector('#route-percent').textContent === '25%');
    results.push({name:'native touch entry and restored navigation',pass:true});
  } finally { await touchContext.close(); }

  const unexpected = errors.filter(error => error.type === 'exception');
  check(unexpected.length === 0,`Unexpected browser exceptions: ${JSON.stringify(unexpected)}`);
  return {base, results, errors};
}
