// Run through the Playwright CLI: run-code --filename .scratch/space-cockpit/check-browser.js
async (page) => {
  const check = (value, message) => { if (!value) throw new Error(message); };
  const base = new URL('.', page.url()).href;
  const failures = [];
  page.on('pageerror', error => failures.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(base + '?variant=A&revision=trace-v4#opening');
  await page.locator('.space canvas').waitFor();
  await page.locator('#cockpit-interior').waitFor();
  await page.waitForFunction(() => document.querySelector('#cockpit-interior').complete);
  await page.waitForFunction(() => document.querySelector('#briefing-title').textContent.includes('Your next idea'));
  check(await page.locator('.prototype-bar').evaluate(node => !node.open),'Preview controls should start collapsed');
  check(await page.locator('.flight-tools').evaluate(node => !node.open),'Flight controls should start collapsed');
  const destination = label => page.locator('.destination-nav').getByRole('link',{name:label,exact:true});
  for (const [width, height] of [[1440,900],[1280,720],[1290,955],[1068,955]]) {
    await page.setViewportSize({width,height});
    for (const [key, name] of [['A','Panoramic bridge'],['B','Command console'],['C','Navigation chart']]) {
      await page.locator('.prototype-bar summary').click();
      await page.getByRole('button', {name:`${key} ${name}`,exact:true}).click();
      await page.locator('.prototype-bar summary').click();
      check(await page.locator('body').getAttribute('data-variant') === key, 'Variant switch failed');
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Horizontal overflow at desktop viewport');
      check(await page.locator('.guide,.officer,.holo-projector,.holo-beam,#guide-dialogue').count()===0,'Mini Me elements remain in the cockpit');
      await page.screenshot({path:`tmp/cockpit-preview/${key}-${width}x${height}-quiet.png`});
    }
  }
  await page.setViewportSize({width:1440,height:900});
  await page.locator('.prototype-bar summary').click();
  await page.getByRole('button',{name:'A Panoramic bridge',exact:true}).click();
  await page.locator('.prototype-bar summary').click();
  await destination('Selected work').click();
  await page.waitForFunction(() => document.querySelectorAll('.project-picks button').length === 4);
  const before = await page.evaluate(() => scrollY);
  for (let i=0;i<4;i++) {
    const trigger = page.locator('.project-picks button').nth(i);
    const name = await trigger.innerText();
    await trigger.focus();
    await page.keyboard.press('Enter');
    await page.locator('#project-detail').waitFor({state:'visible'});
    check(await page.locator('#detail-heading').innerText() === name,'Wrong project in detail panel');
    if (i===0) {
      await page.locator('#project-detail').hover();
      await page.mouse.wheel(0,450);
      await page.waitForFunction(() => document.querySelector('#project-detail').scrollTop > 0);
      check(await page.evaluate(() => scrollY) === before,'Main route moved while reading');
    }
    await page.keyboard.press('Escape');
    await page.locator('#project-detail').waitFor({state:'hidden'});
    await page.waitForFunction(() => !document.body.dataset.returning && !document.body.dataset.approaching && document.querySelector('#travel-status').textContent === 'HOLDING POSITION');
    check(Math.abs(await page.evaluate(() => scrollY) - before)<1,'Return lost journey progress');
    check(await trigger.evaluate(node => node === document.activeElement),'Return lost focus');
  }
  await page.mouse.move(750,400);
  const approach=Math.round(await page.evaluate(()=>(document.documentElement.scrollHeight-innerHeight)/4*.84));
  await page.mouse.wheel(0,approach);
  await page.waitForFunction(y => scrollY > y+100,before);
  await page.waitForFunction(()=>document.body.dataset.travel==='holding');
  const stopped = await page.evaluate(() => scrollY);
  await page.waitForTimeout(350);
  check(await page.evaluate(() => scrollY) === stopped,'Route drifts after scrolling stops');
  await page.mouse.wheel(0,-approach);
  await page.waitForFunction(y => scrollY < y-100,stopped);
  await page.waitForFunction(()=>document.body.dataset.travel==='holding');
  for (const label of ['Capabilities','About & experience','Contact']) await destination(label).click();
  check(await page.getByRole('link',{name:'Discuss a Project',exact:true}).getAttribute('href') === 'mailto:imannnnugraha@gmail.com','Contact destination changed the address');
  await page.locator('.flight-tools summary').focus();
  await page.keyboard.press('Enter');
  check(await page.getByRole('button',{name:'Motion Minimal',exact:true}).isVisible(),'Keyboard could not expose motion control');
  await page.getByRole('button',{name:'◀ Previous',exact:true}).click();
  await page.locator('.flight-tools summary').click();
  check((await page.locator('#briefing-title').innerText()).includes('person'),'Physical destination control failed');
  check(await page.locator('body').getAttribute('data-calm')==='true' && await page.locator('#motion-mode').getAttribute('aria-pressed')==='true','System reduced motion ignored');
  check(await page.locator('#motion-mode').isDisabled(),'Motion control can override the system reduced-motion preference');
  await page.goto(base + '?variant=A&scene=off#opening');
  await page.getByRole('button',{name:'Retry 3D',exact:true}).waitFor();
  await destination('Contact').click();
  check(await page.getByRole('link',{name:'Discuss a Project',exact:true}).isVisible(),'3D fallback hid contact');
  await page.getByRole('button',{name:'Retry 3D',exact:true}).click();
  await page.locator('.space canvas').waitFor();
  await destination('Selected work').click();
  await page.evaluate(() => document.querySelector('.space canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await page.getByRole('button',{name:'Retry 3D',exact:true}).waitFor();
  await page.getByRole('button',{name:'Retry 3D',exact:true}).click();
  await page.waitForFunction(() => document.querySelector('#window-mode').textContent === '3D ONLINE');
  check(new URL(page.url()).hash === '#selected-work','3D recovery lost the current destination');
  await page.goto(base + '?variant=A#opening');
  await page.waitForFunction(() => document.querySelector('#cockpit-interior').complete && document.querySelector('#window-mode').textContent === '3D ONLINE');
  await page.waitForFunction(() => document.querySelector('#briefing-title').textContent.includes('Your next idea'));
  await page.screenshot({path:'tmp/cockpit-preview/cockpit-quiet-final.png'});
  check(failures.length===0,`Uncaught browser errors: ${failures.join('; ')}`);
  return {result:'passed',browser:page.context().browser().version(),viewports:['1440x900','1280x720','1290x955','1068x955'],variants:3,projects:4,checks:'Mini Me absent; system reduced-motion state and control; collapsed menus and keyboard; forward/stop/reverse scroll; destinations; four moon panels and focus return; contact; 3D fallback/retry/context-loss; reload/hash',uncaughtErrors:failures};
}
