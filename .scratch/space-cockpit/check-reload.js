// Open the packaged cockpit route, then use Playwright CLI --filename.
async page=>{
  const base=new URL('.',page.url()).href,results=[],errors=[];
  const check=(value,message)=>{if(!value)throw new Error(message);};
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  const parked=stop=>page.waitForFunction(index=>document.body.dataset.travel==='holding' && document.querySelector('.destination-nav [aria-current]').dataset.stop===String(index) && Math.abs(scrollY/(document.documentElement.scrollHeight-innerHeight)*4-index)<.001,stop);
  for(const mode of ['standard','reduced','phone','fallback']){
    await page.emulateMedia({reducedMotion:mode==='standard'?'no-preference':'reduce'});
    await page.setViewportSize(mode==='phone'?{width:390,height:844}:{width:1280,height:720});
    await page.goto(base+`?variant=A&reloadCase=${mode}${mode==='fallback'?'&scene=off':''}#selected-work`);
    await page.waitForFunction(fallback=>document.querySelector('#window-mode').textContent===(fallback?'TEXT VIEW':'3D ONLINE'),mode==='fallback');
    await parked(1);
    check(await page.title()==='Iman Nugraha — Space Portfolio','Incorrect tab title');
    const icon=await page.locator('link[rel="icon"]').getAttribute('href');
    const iconResponse=await page.request.get(new URL(icon,page.url()).href);
    check(iconResponse.ok()&&(await iconResponse.text()).includes('Iman Nugraha spaceship'),'Favicon unavailable');
    if(mode==='phone'){
      await page.locator('.project-picks button').first().click();
      await page.locator('#project-detail').waitFor({state:'visible'});
    } else {
      await page.locator('.destination-nav [data-stop="4"]').click();await parked(4);
    }
    await page.reload();await parked(0);
    await page.waitForFunction(fallback=>document.querySelector('#window-mode').textContent===(fallback?'TEXT VIEW':'3D ONLINE'),mode==='fallback');
    check(new URL(page.url()).hash==='#opening','Refresh retained the previous destination');
    check(await page.locator('#route-percent').textContent()==='0%','Refresh retained route progress');
    check((await page.locator('#briefing-title').textContent()).includes('Your next idea'),'Refresh retained previous content');
    check(!await page.locator('#project-detail').isVisible(),'Refresh retained an open project');
    check(await page.evaluate(()=>history.scrollRestoration)==='manual','Native scroll restoration is enabled');
    await page.evaluate(()=>location.hash='capabilities');await parked(2);
    check(new URL(page.url()).hash==='#capabilities','Fragment navigation failed after refresh');
    results.push({mode,directFragment:1,reloadStop:0,fragmentAfterReload:2});
  }
  // Retry reloads internally, so its one-use marker preserves the recovery station.
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(base+'?variant=A&reloadCase=recovery&scene=off#selected-work');await parked(1);
  await page.locator('#retry-scene').click();
  await page.waitForFunction(()=>document.querySelector('#window-mode').textContent==='3D ONLINE');await parked(1);
  check(await page.evaluate(()=>!history.state?.recoverScene),'Recovery marker survived initialization');
  await page.reload();await parked(0);
  check(new URL(page.url()).hash==='#opening','A manual refresh after Retry did not reset');
  // Refresh a paused point between stations, not just an exact destination.
  await page.evaluate(()=>scrollTo({top:(document.documentElement.scrollHeight-innerHeight)*1.4/4,behavior:'instant'}));
  await page.waitForFunction(()=>document.querySelector('#travel-status').textContent==='FREE FLIGHT');
  await page.reload();await parked(0);
  check(errors.length===0,errors.join('; '));
  return {result:'passed',results,recoveryThenManualRefresh:'passed',freeFlightRefresh:'passed',title:await page.title(),errors};
}
