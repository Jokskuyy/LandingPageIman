// Run through Playwright CLI with the local preview server running.
async page => {
  const check=(value,message)=>{if(!value)throw new Error(message);};
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await page.addInitScript(()=>{
    const nativeFrame=requestAnimationFrame.bind(window);
    window.stationFrames=0;
    window.requestAnimationFrame=callback=>nativeFrame(time=>{window.stationFrames++;callback(time);});
  });
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.setViewportSize({width:1440,height:900});
  await page.goto('http://127.0.0.1:43188/.scratch/space-cockpit/?variant=C&revision=ambient-v7#opening');
  await page.reload();
  const parked=async index=>{
    try { await page.waitForFunction(stop=>document.body.dataset.travel==='holding' && !document.body.dataset.approaching && !document.body.dataset.returning && !document.querySelector('#project-detail').open && document.querySelector('#travel-status').textContent==='HOLDING POSITION' && Number(document.querySelector('.destination-nav [aria-current]').dataset.stop)===stop && Math.abs(scrollY/(document.documentElement.scrollHeight-innerHeight)*4-stop)<.001,index); }
    catch(error) { throw new Error(`Station ${index} did not settle: ${JSON.stringify(await page.evaluate(()=>({y:scrollY,progress:scrollY/(document.documentElement.scrollHeight-innerHeight)*4,travel:document.body.dataset.travel,status:document.querySelector('#travel-status').textContent,hash:location.hash})))}`,{cause:error}); }
    await page.waitForTimeout(300);
  };
  await page.waitForFunction(()=>document.querySelector('#window-mode').textContent==='3D ONLINE');
  await parked(0);
  await page.mouse.move(720,400);
  await page.mouse.wheel(0,24);
  await page.waitForTimeout(80);
  check((await page.locator('#briefing-title').innerText()).includes('Your next idea'),'Section switched before the ship arrived');
  await parked(1);
  check(new URL(page.url()).hash==='#selected-work','Wheel arrival hash differs from the section');
  const workY=await page.evaluate(()=>scrollY);
  const frames=await page.evaluate(()=>stationFrames);
  await page.waitForTimeout(500);
  check(await page.evaluate(()=>scrollY)===workY,'Parked scroll drifts');
  check(await page.evaluate(()=>stationFrames)>frames,'Ambient motion stopped at the station');
  check(await page.locator('#travel-status').innerText()==='HOLDING POSITION','Ambient motion moved the station');
  await page.locator('.flight-tools summary').click();
  await page.locator('#motion-mode').click();
  await page.waitForTimeout(350);
  const calmFrames=await page.evaluate(()=>stationFrames);
  await page.waitForTimeout(500);
  check(await page.evaluate(()=>stationFrames)===calmFrames,'Minimal motion kept rendering ambient effects');
  await page.locator('#motion-mode').click();
  await page.locator('.flight-tools summary').click();
  await page.screenshot({path:'tmp/cockpit-preview/stations-work-C.png'});
  const moon=page.locator('.project-picks button').first();
  await moon.click();
  await page.waitForTimeout(100);
  check(!await page.locator('#project-detail').isVisible(),'Moon entry skipped the approach');
  await page.keyboard.press('PageDown');
  check(new URL(page.url()).hash==='#selected-work','Keyboard left the station during a moon approach');
  await page.locator('#project-detail').waitFor({state:'visible'});
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!document.body.dataset.returning);
  await parked(1);
  check(await moon.evaluate(node=>node===document.activeElement),'Moon return lost focus');
  check(await page.evaluate(()=>scrollY)===workY,'Moon return lost the station');
  check(await page.locator('#travel-status').innerText()==='HOLDING POSITION','Moon return status did not clear');
  await moon.click(); await page.waitForTimeout(100);
  await page.locator('.destination-nav').getByRole('link',{name:'Capabilities',exact:true}).click();
  await parked(2);
  check(!await page.locator('#project-detail').isVisible(),'Navigation during approach still opened a project');
  check(await page.evaluate(()=>!document.body.dataset.approaching && !document.body.dataset.returning),'Navigation left a moon transition running');
  await page.keyboard.press('PageUp'); await parked(1);
  for(const index of [2,3,4]){
    await page.mouse.move(720,400); await page.mouse.wheel(0,24);
    await parked(index);
    await page.screenshot({path:`tmp/cockpit-preview/stations-${index}-C.png`});
  }
  await page.mouse.wheel(0,-24); await parked(3);
  await page.keyboard.press('PageUp'); await parked(2);
  await page.keyboard.press('Home'); await parked(0);
  await page.mouse.wheel(0,240); await page.waitForTimeout(80);
  await page.locator('.destination-nav').getByRole('link',{name:'Contact',exact:true}).click();
  check(new URL(page.url()).hash==='#opening','Navigation changed the section hash before arrival');
  await parked(4); await page.waitForTimeout(500);
  check(new URL(page.url()).hash==='#contact','Pending wheel snap overrode direct navigation');
  await page.keyboard.press('Home'); await parked(0);
  await page.keyboard.press('End'); await parked(4);
  check(errors.length===0,errors.join('; '));
  return {result:'passed',browser:page.context().browser().version(),checks:'24px wheel gestures park at all five stations; section/planet/hash alignment; ambient frames continue while parked; minimal motion stops frames; moon approach blocks route keys; moon return/focus/status; navigation cancels approach; reverse wheel; PageUp/Home/End; direct navigation cancels pending snap',errors};
}
