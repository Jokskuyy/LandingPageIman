// Open the cockpit route, then run through Playwright CLI with this filename.
async page => {
  const check=(value,message)=>{if(!value)throw new Error(message);};
  const base=new URL('.',page.url()).href;
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.setViewportSize({width:1280,height:720});
  await page.goto(base+'?variant=A&revision=arrival-v11#opening');
  await page.reload();
  const parked=async stop=>{
    try {
      await page.waitForFunction(index=>document.body.dataset.travel==='holding' && document.querySelector('.destination-nav [aria-current]').dataset.stop===String(index) && Math.abs(scrollY/(document.documentElement.scrollHeight-innerHeight)*4-index)<.001,stop,{timeout:3500});
    } catch {
      throw new Error('Near-station arrival did not synchronize: '+JSON.stringify(await page.evaluate(()=>({progress:scrollY/(document.documentElement.scrollHeight-innerHeight)*4,percent:document.querySelector('#route-percent').textContent,heading:document.querySelector('#briefing-title').textContent,status:document.querySelector('#travel-status').textContent,hash:location.hash}))));
    }
  };
  await page.waitForFunction(()=>document.querySelector('#window-mode').textContent==='3D ONLINE');
  await parked(0);
  let cases=0;
  for (const [width,height] of [[1280,720],[1290,955]]) {
    await page.setViewportSize({width,height});
    const leg=await page.evaluate(()=>(document.documentElement.scrollHeight-innerHeight)/4);
    for (const direction of [1,-1]) {
      await page.locator('.destination-nav').getByRole('link',{name:'Selected work',exact:true}).click();
      await parked(1);
      await page.mouse.move(width/2,height*.35);
      await page.mouse.wheel(0,-direction*Math.round(leg*.45));
      await page.waitForTimeout(650);
      check(await page.locator('#travel-status').textContent()==='FREE FLIGHT','Excursion did not remain free');
      await page.mouse.wheel(0,Math.round(leg)+direction*2-await page.evaluate(()=>scrollY));
      await parked(1);
      check(await page.locator('.project-picks button:disabled').count()===0,'Returning to Work left project controls disabled');
      cases++;
    }
    for (const direction of [1,-1]) for(const stop of [1,2,3]) {
      await page.locator('.destination-nav').getByRole('link',{name:direction===1?'Opening':'Contact',exact:true}).click();
      await parked(direction===1?0:4);
      await page.mouse.move(width/2,height*.35);
      await page.mouse.wheel(0,Math.round(leg*stop)+direction*2-await page.evaluate(()=>scrollY));
      await parked(stop);
      const slug=['opening','selected-work','capabilities','about-experience'][stop];
      check(new URL(page.url()).hash==='#'+slug,'Arrival URL did not match the planet');
      check((await page.locator('#briefing-title').textContent()).includes(['','Proof,','From interface','The person'][stop]),'Planet arrived without its briefing');
      check(await page.locator('#travel-status').textContent()==='HOLDING POSITION','Arrived planet retained free-flight status');
      cases++;
    }
    await page.mouse.wheel(0,-24);
    await page.waitForTimeout(650);
    check(await page.locator('#travel-status').textContent()==='FREE FLIGHT','Leaving the current planet was captured');
    check(Math.abs(await page.evaluate(()=>scrollY)-Math.round(leg*3)+24)<2,'Small departure lost free flow');
  }
  check(errors.length===0,errors.join('; '));
  return {result:'passed',cases,checks:'two-pixel overshoots and revisits in both directions; briefing/hash/status arrival; Work project controls recover; small departure stays free; normal motion at two viewport heights',errors};
}
