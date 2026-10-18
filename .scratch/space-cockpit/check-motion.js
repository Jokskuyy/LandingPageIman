// Run with the local server: playwright-cli run-code --filename this-file
async (page) => {
  const check = (value, message) => { if (!value) throw new Error(message); };
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.setViewportSize({width:1440,height:900});
  // Test-only counter: the shipped scene exposes no debug globals.
  await page.addInitScript(() => {
    const request = window.requestAnimationFrame.bind(window);
    window.flightFrames = 0;
    window.requestAnimationFrame = callback => request(time => { window.flightFrames++; callback(time); });
  });
  await page.goto('http://127.0.0.1:43188/.scratch/space-cockpit/?variant=C&revision=flight-v3#opening');
  await page.waitForFunction(() => document.querySelector('#window-mode').textContent === '3D ONLINE' && document.querySelector('#cockpit-interior').complete);
  await page.mouse.move(720,400);
  await page.waitForTimeout(1000);
  await page.screenshot({path:'tmp/cockpit-preview/curved-opening-C.png'});
  // Real wheel input along the curved route, including a stop and a reversal.
  for (let i=0;i<14;i++) { await page.mouse.wheel(0,100); await page.waitForTimeout(90); }
  await page.waitForTimeout(1000);
  check((await page.locator('#briefing-title').innerText()).includes('Proof'),'Wheel did not reach Work');
  const routeY = await page.evaluate(() => scrollY);
  const idle = await page.evaluate(() => flightFrames);
  await page.waitForTimeout(600);
  check(await page.evaluate(() => flightFrames) === idle,'Scene keeps rendering after it settles');
  await page.screenshot({path:'tmp/cockpit-preview/curved-work-C.png'});
  const moon = page.locator('.project-picks button').first();
  await moon.click();
  await page.waitForTimeout(100);
  check(!await page.locator('#project-detail').isVisible(),'Moon panel teleported open before the approach');
  await page.locator('#project-detail').waitFor({state:'visible'});
  await page.screenshot({path:'tmp/cockpit-preview/curved-moon-C.png'});
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.body.dataset.returning);
  check(Math.abs(await page.evaluate(() => scrollY)-routeY)<1,'Moon return lost route position');
  check(await moon.evaluate(node => node === document.activeElement),'Moon return lost focus');
  await page.mouse.move(720,400);
  for (let i=0;i<12;i++) { await page.mouse.wheel(0,100); await page.waitForTimeout(90); }
  await page.waitForTimeout(1000);
  check((await page.locator('#briefing-title').innerText()).includes('interface'),'Wheel did not reach Capabilities');
  await page.screenshot({path:'tmp/cockpit-preview/curved-capabilities-C.png'});
  for (let i=0;i<12;i++) { await page.mouse.wheel(0,-100); await page.waitForTimeout(90); }
  await page.waitForTimeout(1000);
  check((await page.locator('#briefing-title').innerText()).includes('Proof'),'Reverse wheel did not return to Work');
  check(errors.length===0,`Uncaught errors: ${errors.join('; ')}`);
  return {result:'passed',browser:page.context().browser().version(),motion:'standard',checks:'gradual wheel travel, idle render stop, animated moon approach, focus/progress return, reverse travel',uncaughtErrors:errors};
}
