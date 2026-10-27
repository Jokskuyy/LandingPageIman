// Open the packaged cockpit route, then run with Playwright CLI --filename.
async page=>{
  const check=(value,message)=>{if(!value)throw new Error(message);};
  const base=new URL('.',page.url()).href,results=[],errors=[];
  await page.emulateMedia({reducedMotion:'reduce'});
  const sizes=[[320,568],[390,844],[430,932],[768,1024],[1024,1366],[844,390],[667,375]];
  for(const [width,height] of sizes) {
    const context=await page.context().browser().newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:2,reducedMotion:'reduce'});
    // This suite covers the cockpit after entry; check-intro.js covers first visits.
    await context.addInitScript(() => sessionStorage.setItem('iman:orbital-intro:v1','complete'));
    try {
      const p=await context.newPage();p.on('pageerror',error=>errors.push(error.message));
      p.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
      await p.goto(base+`?variant=A&responsive=${width}#opening`);
      await p.waitForFunction(()=>document.querySelector('#window-mode').textContent==='3D ONLINE');
      await p.evaluate(()=>document.fonts.ready);
      await p.locator('#cockpit-interior').evaluate(image=>image.decode());
      for(const index of [0,1,2,3,4]) {
        if(index)await p.locator(`.destination-nav [data-stop="${index}"]`).tap();
        await p.waitForFunction(stop=>document.body.dataset.travel==='holding' && Number(document.querySelector('.destination-nav [aria-current]').dataset.stop)===stop,index);
        await p.waitForFunction(()=>{const a=document.querySelector('.destination-nav [aria-current]').getBoundingClientRect(),n=document.querySelector('.destination-nav').getBoundingClientRect();return a.left>=n.left && a.right<=n.right;});
        const layout=await p.evaluate(()=>{
          const b=document.querySelector('#briefing'),r=b.getBoundingClientRect(),a=document.querySelector('.destination-nav [aria-current]').getBoundingClientRect();
          return {overflow:document.documentElement.scrollWidth-innerWidth,contentOverflow:b.scrollWidth-b.clientWidth,inside:r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight,targetHeight:a.height,heading:document.querySelector('#briefing-title').textContent,hash:location.hash};
        });
        check(layout.overflow<2 && layout.contentOverflow<2 && layout.inside,`${width}x${height}: clipped section ${index}: ${JSON.stringify(layout)}`);
        check(layout.targetHeight>=44,`${width}: destination target too small`);
        check(layout.hash==='#'+['opening','selected-work','capabilities','about-experience','contact'][index],`${width}: hash does not match section`);
      }
      await p.locator('.destination-nav [data-stop="1"]').tap();
      await p.waitForFunction(()=>document.querySelectorAll('.project-picks button:not(:disabled)').length===4);
      const picks=await p.locator('.project-picks button').evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect(),b=document.querySelector('#briefing').getBoundingClientRect();return {height:r.height,visible:r.top>=b.top&&r.bottom<=b.bottom};}));
      check(picks.every(p=>p.height>=44),`${width}: project target too small`);
      if(height>width)check(picks.every(p=>p.visible),`${width}: a portrait project choice is hidden below the reader`);
      const moons=await p.evaluate(async()=>{
        const THREE=await import('./vendor/three/three.module.js');
        const {sampleFlight,frameWindow,moonOffsets,planetSpecs}=await import('./flight-path.js?v=20261019-responsive-v14');
        const {width,height,left,top}=document.querySelector('#space').getBoundingClientRect(),camera=new THREE.PerspectiveCamera(43,width/height,.1,160);
        sampleFlight(1,camera.position,camera.quaternion);frameWindow(camera,width,height);camera.updateMatrixWorld();
        const interior=document.querySelector('#cockpit-interior'),mask=document.createElement('canvas');mask.width=width;mask.height=height;
        const drawing=mask.getContext('2d'),scale=Math.max(width/interior.naturalWidth,height/interior.naturalHeight);
        if(height>=width)drawing.drawImage(interior,(width-interior.naturalWidth*scale)/2,(height-interior.naturalHeight*scale)/2,interior.naturalWidth*scale,interior.naturalHeight*scale);
        else drawing.drawImage(interior,0,0,width,height);
        const right=new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion),up=new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion);
        return moonOffsets.map(offset=>{
          const center=planetSpecs[0].position.clone().add(offset),v=center.clone().project(camera),x=left+(v.x+1)*width/2,y=top+(1-v.y)*height/2;
          const clear=[new THREE.Vector3(),right.clone().multiplyScalar(.67),right.clone().multiplyScalar(-.67),up.clone().multiplyScalar(.67),up.clone().multiplyScalar(-.67)].every(edge=>{
            const point=center.clone().add(edge).project(camera),px=left+(point.x+1)*width/2,py=top+(1-point.y)*height/2,hit=document.elementFromPoint(px,py);
            return !hit?.closest('.briefing,nav,.identity-bar,.flight-console')&&drawing.getImageData(Math.floor(px-left),Math.floor(py-top),1,1).data[3]<64;
          });return {x,y,clear};
        });
      });
      check(moons.every(m=>m.x>=0&&m.x<=width&&m.y>=0&&m.y<=height&&m.clear),`${width}: a moon is outside or hidden behind cockpit UI: ${JSON.stringify(moons)}`);
      // Native touch opens a small 3D moon; named buttons remain the alternate target.
      const projectName=await p.locator('.project-picks button').first().textContent();
      await p.touchscreen.tap(moons[0].x,moons[0].y);
      await p.locator('#project-detail').waitFor({state:'visible'});
      check((await p.locator('#detail-heading').textContent()).trim()===projectName.trim(),`${width}: moon opened the wrong project`);
      const bounds=await p.locator('#project-detail').evaluate(node=>{const r=node.getBoundingClientRect();return {inside:r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight,overflow:node.scrollWidth-node.clientWidth};});
      check(bounds.inside&&bounds.overflow<2,`${width}: project sheet overflows`);
      await p.locator('#return-to-planet').tap();
      await p.waitForFunction(()=>!document.body.dataset.returning && !document.body.dataset.approaching && !document.querySelector('#project-detail').open && document.querySelector('#travel-status').textContent==='HOLDING POSITION');
      check(await p.locator('.project-picks button').first().evaluate(node=>node===document.activeElement),`${width}: return lost focus`);
      results.push({width,height,sections:5,overflow:0,moons:4,project:'touch open and return'});
    } finally {await context.close();}
  }
  // Use Chromium's native touch input, not dispatched DOM events, for scrolling.
  const context=await page.context().browser().newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,reducedMotion:'reduce'});
  await context.addInitScript(() => sessionStorage.setItem('iman:orbital-intro:v1','complete'));
  try {
    const p=await context.newPage(),cdp=await context.newCDPSession(p);
    p.on('pageerror',error=>errors.push(error.message));
    p.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
    await p.goto(base+'?variant=A&responsive=gestures#opening');
    await p.bringToFront();
    await p.waitForFunction(()=>document.querySelector('#window-mode').textContent==='3D ONLINE' && document.body.dataset.travel==='holding');
    const swipe=async(x,y,yDistance,xDistance=0)=>{
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
      for(let step=1;step<=10;step++){
        await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+xDistance*step/10,y:y+yDistance*step/10}]});
        await p.waitForTimeout(25);
      }
      await p.waitForTimeout(100);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      await p.waitForTimeout(350);
    };
    await swipe(80,330,-130);
    await p.waitForTimeout(700);
    check(await p.evaluate(()=>scrollY)>80,'Sky swipe did not move the route');
    check(await p.locator('#travel-status').textContent()==='FREE FLIGHT','Small swipe was forced into a station');
    await p.locator('.brand').tap();
    await p.waitForFunction(()=>document.body.dataset.travel==='holding' && location.hash==='#opening');
    await swipe(280,78,0,-180);
    check(await p.locator('.destination-nav').evaluate(node=>node.scrollLeft)>80,'Horizontal nav swipe did not move the destinations');
    check(await p.evaluate(()=>scrollY)===0,'Horizontal nav swipe moved the route');
    await p.locator('.destination-nav [data-stop="2"]').tap();
    await p.waitForFunction(()=>document.body.dataset.travel==='holding' && location.hash==='#capabilities');
    const routeY=await p.evaluate(()=>scrollY),reader=await p.locator('#briefing').boundingBox();
    await swipe(reader.x+reader.width*.65,reader.y+reader.height-24,-140);
    check(await p.locator('#briefing').evaluate(node=>node.scrollTop)>40,'Reading swipe did not scroll the console');
    check(Math.abs(await p.evaluate(()=>scrollY)-routeY)<2,'Reading swipe moved the route');
    await p.locator('#briefing').focus();await p.keyboard.press('Home');await p.keyboard.press('PageDown');
    check(Math.abs(await p.evaluate(()=>scrollY)-routeY)<2,'Reader keyboard changed the route');
    await p.locator('.destination-nav [data-stop="1"]').tap();
    await p.waitForFunction(()=>document.querySelectorAll('.project-picks button:not(:disabled)').length===4);
    await p.locator('.project-picks [data-project="1"]').tap();await p.locator('#project-detail').waitFor({state:'visible'});
    const workY=await p.evaluate(()=>scrollY),sheet=await p.locator('#project-detail').boundingBox();
    await swipe(sheet.x+sheet.width*.6,sheet.y+sheet.height-50,-230);
    check(await p.locator('#project-detail').evaluate(node=>node.scrollTop)>100,'Project swipe did not scroll the sheet');
    check(Math.abs(await p.evaluate(()=>scrollY)-workY)<2,'Project swipe moved the route');
    await p.setViewportSize({width:844,height:390});
    await p.locator('#return-to-planet').tap();
    await p.waitForFunction(()=>!document.body.dataset.returning && !document.querySelector('#project-detail').open && document.querySelector('#travel-status').textContent==='HOLDING POSITION');
    const rotated=await p.evaluate(()=>({raw:scrollY/(document.documentElement.scrollHeight-innerHeight)*4,y:scrollY,total:document.documentElement.scrollHeight,width:innerWidth,height:innerHeight,hash:location.hash,status:document.querySelector('#travel-status').textContent,travel:document.body.dataset.travel}));
    check(Math.abs(rotated.raw-1)<.001,`Rotation/return lost the station: ${JSON.stringify(rotated)}`);
    await p.setViewportSize({width:390,height:844});
    await p.locator('.destination-nav [data-stop="4"]').tap();
    await p.waitForFunction(()=>location.hash==='#contact' && document.body.dataset.travel==='holding');
    await p.setViewportSize({width:844,height:390});await p.setViewportSize({width:320,height:568});
    await p.waitForFunction(()=>{const a=document.querySelector('.destination-nav [aria-current]').getBoundingClientRect(),n=document.querySelector('.destination-nav').getBoundingClientRect();return a.left>=n.left&&a.right<=n.right;});
    check(new URL(p.url()).hash==='#contact','Nav rotation lost the destination');
    await p.setViewportSize({width:390,height:844});
    await p.goto(base+'?variant=A&responsive=fallback&scene=off#selected-work');
    await p.waitForFunction(()=>document.querySelector('#window-mode').textContent==='TEXT VIEW' && document.querySelectorAll('.project-picks button:not(:disabled)').length===4);
    await p.locator('.project-picks [data-project="3"]').tap();await p.locator('#project-detail').waitFor({state:'visible'});
    await p.locator('#return-to-planet').tap();
    await p.waitForFunction(()=>!document.querySelector('#project-detail').open && !document.body.dataset.returning && document.querySelector('#travel-status').textContent==='HOLDING POSITION');
    await p.locator('#retry-scene').tap();
    await p.waitForFunction(()=>document.querySelector('#window-mode').textContent==='3D ONLINE');
    results.push({gestures:'native route swipe, horizontal nav, isolated reader and modal scrolling, keyboard reading, rotation, fallback/retry'});
  } finally {await context.close();}
  check(errors.length===0,errors.join('; '));
  return {result:'passed',browser:page.context().browser().version(),results,errors,limit:'Chromium touch emulation; no physical-device or Safari claim'};
}
