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
  const ready = async tab => {
    await tab.waitForFunction(() => document.querySelector('#orbital-intro')?.dataset.phase === 'ready');
    check(await tab.locator('#orbital-skip').count() === 0,'Skip Intro remains in the DOM');
  };
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
    check(await tab.locator('#orbital-skip').count() === 0,'Skip Intro remains during preparation');
    check(await tab.evaluate(() => document.activeElement.id) === 'orbital-title','Preparation did not focus the intro title');
    check(await tab.locator('#cockpit').getAttribute('inert') !== null,'Cockpit must be inert');
    check(await tab.locator('.guide,.officer,.holo-projector,.holo-beam,#guide-dialogue').count() === 0,'Mini Me elements remain during intro');
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
    check(await tab.locator('#orbital-enter').evaluate(node => node === document.activeElement),'Ready state did not focus entry');
    check(await tab.locator('#orbital-enter').evaluate(node => getComputedStyle(node).outlineStyle) !== 'none','Keyboard focus is invisible');
    await tab.keyboard.press('Tab');
    check(await tab.locator('#orbital-enter').evaluate(node => node === document.activeElement),'Tab order misses entry');
    await tab.keyboard.press('Shift+Tab');
    check(await tab.locator('#orbital-enter').evaluate(node => node === document.activeElement),'Reverse Tab leaves the intro');
    await tab.keyboard.press('Enter');
    await gone(tab);
    check(await tab.evaluate(() => document.activeElement.id) === 'briefing-title','Handoff lost keyboard focus');
    check(await tab.locator('#route-percent').innerText() === '0%','Entry advanced route');
    check(await tab.locator('#destination-announcement').textContent() === 'Arrived at Opening.','Handoff did not announce the current destination');
    check(await tab.locator('.guide,.officer,.holo-projector,.holo-beam,#guide-dialogue').count() === 0,'Mini Me elements returned after handoff');
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
    // Screenshots can outlast the 350ms quiet window; keep this input continuous.
    for (let i=0;i<14;i++) {
      await tab.mouse.wheel(0,90);
      await tab.waitForTimeout(100);
      check(await tab.evaluate(() => scrollY) === 0,'Momentum advanced journey during handoff');
    }
    await gone(tab);
    check(await tab.evaluate(() => window.__completionWrites) === 1,'Repeated input completed twice');
    await cleaned(tab);
    check(await tab.locator('#route-percent').innerText() === '0%','Momentum skipped Opening');
    await tab.mouse.wheel(0,700);
    await tab.waitForFunction(() => scrollY > 0);
  });

  await run('preparation has no Skip or early entry; delayed scene completes normally', async tab => {
    let pending;
    await tab.route('**/vendor/three/three.module.js', route => { pending=route; });
    await tab.goto(base,{ waitUntil:'domcontentloaded' });
    check(await tab.locator('#orbital-skip').count() === 0,'Preparing view still offers Skip');
    await tab.keyboard.press('Enter');
    await tab.mouse.wheel(0,180);
    check(await tab.locator('#orbital-enter').isHidden(),'Preparation allows early entry');
    check(await tab.locator('#orbital-status').innerText() === 'Preparing Bridge','Delayed scene falsely reports readiness');
    await pending.continue();
    await ready(tab);
    await tab.locator('#orbital-enter').click(); await gone(tab);
    await cleaned(tab);
    check((await tab.locator('#briefing-title').innerText()).includes('Your next idea'),'Late initialization replaced the Opening view');
    check(await tab.locator('#route-percent').innerText() === '0%','Late initialization advanced the Opening route');
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

  await run('ready fallback entry and Retry 3D preserve the station once', async tab => {
    await tab.goto(base+'?scene=off#contact'); await ready(tab);
    check(await tab.locator('#window-mode').textContent() === 'TEXT VIEW','Failure was not handled');
    await tab.locator('#orbital-enter').click(); await gone(tab); await cleaned(tab);
    check(await tab.locator('#route-percent').innerText() === '100%','Entry lost deliberate deep link');
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
    await tab.locator('#orbital-enter').click(); await gone(tab); await cleaned(tab);
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

  await run('cold module delay keeps the dark intro, then enables normal entry', async tab => {
    let pending, unblock;
    const blocked = new Promise(resolve => { unblock=resolve; });
    await tab.route('**/orbital-intro.js*', route => { pending=route; unblock(); });
    await tab.goto(base,{ waitUntil:'commit' });
    await tab.locator('#orbital-intro').waitFor({ state:'visible' });
    await blocked;
    check(await tab.locator('#orbital-skip').count() === 0,'Cold module stage still offers Skip');
    check(await tab.locator('#orbital-enter').isHidden(),'Cold module stage enables early entry');
    check(await tab.locator('#cockpit').evaluate(node => getComputedStyle(node).visibility) === 'hidden','Cockpit flashed before modules arrived');
    check(await tab.locator('.guide,.officer,.holo-projector,.holo-beam,#guide-dialogue').count() === 0,'Mini Me elements remain before the intro module arrives');
    check(await tab.evaluate(key => sessionStorage.getItem(key),sessionKey) === null,'Cold module stage completed before app handoff');
    await pending.continue();
    await ready(tab);
    await tab.locator('#orbital-enter').click(); await gone(tab); await cleaned(tab);
    check(await tab.evaluate(key => sessionStorage.getItem(key),sessionKey) === 'complete','Entry completion not recorded after app starts');
  });

  for (const module of ['prototype.js','orbital-intro.js']) await run(`failed ${module} reveals the existing portfolio recovery`, async tab => {
    await tab.route(`**/${module}*`, route => route.abort('failed'));
    await tab.goto(base,{ waitUntil:'domcontentloaded' });
    await tab.locator('#orbital-intro').waitFor({ state:'hidden' });
    check(await tab.locator('#orbital-skip').count() === 0,'Failure restored Skip');
    check(await tab.locator('.scene-recovery').isVisible(),'Module failure hides portfolio recovery');
    check(await tab.locator('#scene-status span').innerText() === 'The bridge could not start. Read the portfolio below.','Module failure has no useful status');
    check(await tab.locator('.scene-recovery').evaluate(node => node === document.activeElement),'Module failure did not focus recovery');
    await tab.locator('.scene-recovery').click();
    check(tab.url() === new URL('../index.html',base).href,'Recovery does not open the existing portfolio');
  });

  await run('a module that misses its deadline reveals recovery and cannot reopen the intro later', async tab => {
    let pending, unblock;
    const blocked = new Promise(resolve => { unblock=resolve; });
    await tab.route('**/orbital-intro.js*', route => { pending=route; unblock(); });
    await tab.goto(base,{ waitUntil:'commit' });
    await blocked;
    await tab.locator('#orbital-intro').waitFor({ state:'hidden',timeout:15000 });
    check(await tab.locator('.scene-recovery').isVisible(),'Module deadline left no recovery');
    check(await tab.evaluate(() => document.documentElement.dataset.orbitalGate) === 'unavailable','Module deadline did not release the stage gate');
    check(await tab.evaluate(key => sessionStorage.getItem(key),sessionKey) === null,'Failed bootstrap falsely completed the intro');
    await pending.continue();
    await tab.locator('#orbital-intro').waitFor({ state:'detached' });
    await tab.waitForFunction(() => document.querySelector('#window-mode').textContent === '3D ONLINE');
    check(await tab.locator('#route-percent').innerText() === '0%','Late bootstrap advanced the journey');
    check(await tab.evaluate(() => document.activeElement.id) === 'briefing-title','Late module recovery left focus in the hidden status');
    check(await tab.evaluate(key => sessionStorage.getItem(key),sessionKey) === null,'Late bootstrap recorded a cinematic that was never played');
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
    check(await tab.locator('#destination-announcement').textContent() === 'Arrived at Contact.','Deep-link handoff announced the wrong destination');
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
    for (const selector of ['#orbital-status','#orbital-enter','#orbital-hint']) {
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
