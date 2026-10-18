// Open the cockpit route, then run this through Playwright CLI.
async page => {
  const check=(value,message)=>{if(!value)throw new Error(message);};
  const base=new URL('.',page.url()).href;
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  let cases=0;
  for(const mode of ['normal','tall','reduced','fallback']) {
    await page.emulateMedia({reducedMotion:mode==='reduced'?'reduce':'no-preference'});
    await page.setViewportSize({width:mode==='tall'?1290:1280,height:mode==='tall'?955:720});
    await page.goto(base+`?variant=A&revision=crossings-v12${mode==='fallback'?'&scene=off':''}#opening`);
    await page.reload();
    if(mode!=='fallback') await page.waitForFunction(()=>document.querySelector('#window-mode').textContent==='3D ONLINE');
    await page.evaluate(()=>addEventListener('scrollend',()=>{
      if(Math.abs(scrollY/(document.documentElement.scrollHeight-innerHeight)*4-window.stationTarget)<.001) window.stationScrollEnded=true;
    }));
    const parked=async stop=>{
      try { await page.waitForFunction(index=>document.body.dataset.travel==='holding' && document.querySelector('.destination-nav [aria-current]').dataset.stop===String(index) && Math.abs(scrollY/(document.documentElement.scrollHeight-innerHeight)*4-index)<.001,stop,{timeout:4000}); }
      catch { throw new Error(`${mode} did not park at ${stop}: `+JSON.stringify(await page.evaluate(()=>({progress:scrollY/(document.documentElement.scrollHeight-innerHeight)*4,section:document.querySelector('.destination-nav [aria-current]').dataset.stop,status:document.querySelector('#travel-status').textContent,hash:location.hash})))); }
    };
    const navigate=async stop=>{
      await page.evaluate(index=>{
        window.stationTarget=index;
        window.stationScrollEnded=Math.abs(scrollY/(document.documentElement.scrollHeight-innerHeight)*4-index)<.001;
      },stop);
      await page.locator('.destination-nav [data-stop="'+stop+'"]').click();
      await parked(stop);
      // A rounded arrival can precede the browser's final smooth-scroll frame.
      await page.waitForFunction(()=>window.stationScrollEnded);
    };
    await parked(0);
    const leg=await page.evaluate(()=>(document.documentElement.scrollHeight-innerHeight)/4);
    const slugs=['opening','selected-work','capabilities','about-experience','contact'];
    for(const direction of [1,-1]) for(const stop of [1,2,3]) {
      await navigate(direction===1?0:4);
      await page.mouse.move(640,300);
      await page.mouse.wheel(0,Math.round(leg*(stop+direction*.04))-await page.evaluate(()=>scrollY));
      await parked(stop);
      check(new URL(page.url()).hash==='#'+slugs[stop],`${mode}: overshoot left the old section hash`);
      cases++;
    }
    for(const [start,position,section] of [[0,1.35,1],[4,2.65,3],[0,2.4,2],[4,1.6,2]]) {
      await navigate(start);
      await page.mouse.move(640,300);
      await page.mouse.wheel(0,Math.round(leg*position)-await page.evaluate(()=>scrollY));
      try { await page.waitForFunction(index=>document.querySelector('.destination-nav [aria-current]').dataset.stop===String(index) && document.querySelector('#travel-status').textContent==='FREE FLIGHT',section,{timeout:4000}); }
      catch { throw new Error(`${mode}: passed planet kept the previous section at ${position}`); }
      check(Math.abs(await page.evaluate(()=>scrollY)-Math.round(leg*position))<2,`${mode}: mid-route flight was forced back`);
      check(new URL(page.url()).hash==='#'+slugs[section],`${mode}: passed section and URL differ`);
      check((await page.locator('#briefing-title').textContent()).includes(['','Proof,','From interface','The person'][section]),`${mode}: passed planet kept the previous briefing`);
      cases++;
    }
    await navigate(1);
    await page.mouse.wheel(0,24);
    await page.waitForTimeout(650);
    const departure=await page.evaluate(()=>({y:scrollY,status:document.querySelector('#travel-status').textContent}));
    check(departure.status==='FREE FLIGHT' && Math.abs(departure.y-Math.round(leg)-24)<2,`${mode}: small departure changed: ${JSON.stringify(departure)}`);
  }
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.setViewportSize({width:1280,height:720});
  await page.goto(base+'?variant=A&revision=crossings-v12#opening');
  await page.reload();
  await page.waitForFunction(()=>document.querySelector('#window-mode').textContent==='3D ONLINE' && document.body.dataset.travel==='holding');
  await page.evaluate(()=>addEventListener('scroll',()=>{
    window.crossingSectionBeforeLoss=document.querySelector('.destination-nav [aria-current]').dataset.stop;
    document.querySelector('.space canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext();
  },{once:true}));
  await page.mouse.move(640,300);
  await page.mouse.wheel(0,Math.round(await page.evaluate(()=>(document.documentElement.scrollHeight-innerHeight)/4*1.35)));
  await page.waitForFunction(()=>document.querySelector('#window-mode').textContent==='TEXT VIEW' && document.querySelector('#travel-status').textContent==='FREE FLIGHT' && document.querySelector('.destination-nav [aria-current]').dataset.stop==='1');
  check(await page.evaluate(()=>window.crossingSectionBeforeLoss)==='0','Context-loss fixture did not interrupt before the camera crossing');
  check(new URL(page.url()).hash==='#selected-work','Context-loss handoff kept the old section hash');
  check(await page.locator('.project-picks button:disabled').count()===4,'Context-loss handoff enabled moon entry while in free flight');
  cases++;
  check(errors.length===0,errors.join('; '));
  return {result:'passed',cases,modes:['normal','tall','reduced','fallback'],checks:'four-percent overshoots; passed-planet section/hash updates during free flight; multiple skipped planets; small departures remain free; context-loss handoff before camera crossing',errors};
}
