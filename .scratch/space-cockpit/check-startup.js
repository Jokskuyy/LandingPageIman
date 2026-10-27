// Open the packaged /cockpit/ route before running with playwright-cli --filename.
async page => {
  const base=new URL('.',page.url()).href;
  const results=[];
  for(const [name,delay,cpu] of [['normal',0,1],['delayed-module',1400,1],['slower-cpu',0,6]]) {
    const tab=await page.context().newPage();
    await tab.setViewportSize({width:1440,height:900});
    await tab.emulateMedia({reducedMotion:'no-preference'});
    const cdp=await tab.context().newCDPSession(tab);
    await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpu});
    if(delay) await tab.route('**/vendor/three/three.module.js',async route=>{
      await new Promise(resolve=>setTimeout(resolve,delay));
      await route.continue();
    });
    await tab.addInitScript(()=>{
      window.__introStartup={frames:[],longTasks:[]};
      const observer=new PerformanceObserver(list=>{
        for(const task of list.getEntries()) window.__introStartup.longTasks.push({start:task.startTime,duration:task.duration});
      });
      observer.observe({type:'longtask',buffered:true});
      const sample=time=>{
        const root=document.querySelector('#orbital-intro');
        if(root && !root.hidden) {
          const progress=parseFloat(root.style.getPropertyValue('--orb-fill'))||0;
          const host=root.querySelector('#orbital-canvas');
          const mounted=Boolean(host?.querySelector('canvas')) && getComputedStyle(host).visibility!=='hidden';
          window.__introStartup.frames.push({time,progress,mounted,phase:root.dataset.phase});
          if(root.dataset.phase==='ready') {observer.disconnect();window.__introStartup.done=true;return;}
        }
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    try {
      await tab.goto(base,{waitUntil:'domcontentloaded'});
      await tab.waitForFunction(()=>window.__introStartup.done);
      const data=await tab.evaluate(()=>window.__introStartup);
      const frames=data.frames;
      const beforeScene=frames.filter(frame=>!frame.mounted);
      const firstScene=frames.find(frame=>frame.mounted);
      const firstAnimated=frames.find(frame=>frame.phase==='initializing');
      const jumps=frames.slice(1).map((frame,index)=>frame.progress-frames[index].progress);
      const metric={name,cpu,delayMs:delay,frames:frames.length,
        firstSceneMs:firstScene?.time,fillAtFirstScene:firstScene?.progress,
        maxFillBeforeScene:Math.max(0,...beforeScene.map(frame=>frame.progress)),
        largestFillJump:Math.max(0,...jumps),longTasks:data.longTasks};
      metric.movingFrames=frames.filter(frame=>frame.progress>0 && frame.progress<100).length;
      metric.cinematicMs=frames.at(-1).time-firstAnimated.time;
      results.push(metric);
    } finally {await tab.close();}
  }
  const failure=results.find(result=>result.maxFillBeforeScene>.01 || result.largestFillJump>1.7);
  if(failure) throw new Error(JSON.stringify({base,results,pass:false}));
  return {base,results,pass:!failure,reason:failure?`${failure.name}: fill ${failure.maxFillBeforeScene.toFixed(1)}% before scene; largest frame jump ${failure.largestFillJump.toFixed(2)} percentage points`:null};
}
