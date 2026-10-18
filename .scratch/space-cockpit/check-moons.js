// Open the packaged cockpit route before running through Playwright CLI.
async page => {
  const check=(value,message)=>{if(!value)throw new Error(message);};
  const base=new URL('.',page.url()).href, errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  let cases=0;
  for(const mode of ['normal','tall','reduced','fallback']) {
    await page.emulateMedia({reducedMotion:mode==='reduced'?'reduce':'no-preference'});
    await page.setViewportSize({width:mode==='tall'?1068:1280,height:mode==='tall'?955:720});
    await page.goto(base+`?variant=A&revision=moons-v13${mode==='fallback'?'&scene=off':''}#selected-work`);
    await page.reload();
    await page.waitForFunction(()=>document.body.dataset.travel==='holding' && document.querySelectorAll('.project-picks button:not(:disabled)').length===4);
    await page.waitForFunction(fallback=>document.querySelector('#window-mode').textContent===(fallback?'TEXT VIEW':'3D ONLINE'),mode==='fallback');
    const points=mode==='fallback'?[]:await page.evaluate(async()=>{
      const THREE=await import('./vendor/three/three.module.js');
      const {sampleFlight,moonOffsets,planetSpecs}=await import('./flight-path.js?v=20261019-moons-v13');
      const {width,height,left,top}=document.querySelector('#space').getBoundingClientRect();
      const camera=new THREE.PerspectiveCamera(43,width/height,.1,160);
      sampleFlight(1,camera.position,camera.quaternion);
      camera.setViewOffset(width,height,-width*.03,height*.08,width,height);camera.updateMatrixWorld();
      return moonOffsets.map(offset=>{
        const point=planetSpecs[0].position.clone().add(offset).project(camera);
        return {x:left+(point.x+1)*width/2,y:top+(1-point.y)*height/2};
      });
    });
    for(let index=0;index<4;index++) {
      const button=page.locator(`.project-picks [data-project="${index}"]`), name=await button.textContent();
      await button.focus();
      if(mode!=='fallback') {
        check(await button.getAttribute('data-targeted')!==null,`${mode}: keyboard focus did not target moon ${index}`);
        await page.mouse.move(20,400); await page.mouse.move(20,420);
        check(await button.getAttribute('data-targeted')!==null,`${mode}: empty-window pointer movement erased keyboard targeting`);
        await page.mouse.move(points[index].x,points[index].y);
        check(await button.getAttribute('data-targeted')!==null,`${mode}: moon ${index} did not resolve to its project`);
        await page.mouse.click(points[index].x,points[index].y);
      } else await page.keyboard.press('Enter');
      await page.locator('#project-detail').waitFor({state:'visible'});
      check((await page.locator('#detail-heading').textContent()).trim()===name.trim(),`${mode}: wrong moon project opened`);
      check(await page.locator('#project-detail a[href^="https://github.com/"]').count()>0,`${mode}: missing project evidence`);
      const bounds=await page.locator('#project-detail').evaluate(node=>({x:node.getBoundingClientRect().x,right:node.getBoundingClientRect().right,bottom:node.getBoundingClientRect().bottom,width:innerWidth,height:innerHeight,overflow:node.scrollWidth-node.clientWidth}));
      check(bounds.x>=0 && bounds.right<=bounds.width && bounds.bottom<=bounds.height && bounds.overflow<2,`${mode}: detail panel overflows`);
      await page.keyboard.press('Escape');
      await page.waitForFunction(()=>!document.body.dataset.returning && !document.body.dataset.approaching && !document.querySelector('#project-detail').open && document.querySelector('#travel-status').textContent==='HOLDING POSITION');
      check(await button.evaluate(node=>node===document.activeElement),`${mode}: return lost project focus`);
      check(await page.locator('.project-picks button:not(:disabled)').count()===4,`${mode}: return did not enable projects`);
      check(await page.evaluate(()=>Math.abs(scrollY/(document.documentElement.scrollHeight-innerHeight)*4-1)<.001),`${mode}: return lost station`);
      cases++;
    }
  }
  check(errors.length===0,errors.join('; '));
  return {result:'passed',cases,checks:'four distinct project moons; keyboard/hover targeting and direct 3D clicks at two sizes; reduced motion; text fallback; source evidence; panel overflow; return/focus/station restoration',errors};
}
