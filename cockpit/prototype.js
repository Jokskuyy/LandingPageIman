// Three layouts of the same real portfolio. Read-only prototype, not production.
const $ = selector => document.querySelector(selector);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let calm = false;
const isReduced = () => reduced.matches || calm;
const stops = ['Opening', 'Selected work', 'Capabilities', 'About & experience', 'Contact'];
const slugs = ['opening', 'selected-work', 'capabilities', 'about-experience', 'contact'];
const variants = { A: 'Panoramic bridge', B: 'Command console', C: 'Navigation chart' };
const dialogues = [
  'Captain, follow the light to explore the work.',
  'Captain, four project moons are ready to inspect.',
  'Captain, these are the capabilities behind the work.',
  'Captain, here are my background and experience.',
  'Captain, ready for a new mission? Open a channel.'
];
const opening = $('#briefing-content').innerHTML;
let variant = 'A', currentStop = -1, progress = 0, sectionTravel = 0, source, sourceError = false, projects = [], scene;
let routeImmediate = false, sceneFailed = false, returnFocus, savedScroll = 0, moonRequest = 0;
let snapTimer, scrollDirection = 0, lastScrollY = scrollY, crossedStop = null;
const detail = $('#project-detail');
$('#cockpit-interior').addEventListener('error', () => $('#cockpit').dataset.interior = 'fallback');
function updateMotionControl() {
  document.body.dataset.calm = String(isReduced());
  $('#motion-mode').setAttribute('aria-pressed', String(isReduced()));
  $('#motion-mode').disabled = reduced.matches;
  $('#motion-mode').title = reduced.matches ? 'Minimal motion follows your system preference.' : 'Toggle minimal motion';
  $('#motion-setting').textContent = isReduced() ? 'Minimal' : 'Standard';
  scene?.render();
}
$('#motion-mode').addEventListener('click', () => { calm = !calm; updateMotionControl(); });
reduced.addEventListener('change', updateMotionControl);
updateMotionControl();
const stateText = () => `Direction ${variant}: ${variants[variant]}. Destination: ${stops[currentStop]}.`;

function setVariant(next) {
  if (!variants[next]) return;
  variant = next;
  document.body.dataset.variant = next;
  $('#variant-name').textContent = next;
  document.querySelectorAll('.variant-buttons button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.variant === next)));
  const url = new URL(location.href);
  url.searchParams.set('variant', next);
  history.replaceState(null, '', url);
  $('#prototype-state').textContent = stateText();
  scene?.resize();
}
document.querySelectorAll('.variant-buttons button').forEach(button => button.addEventListener('click', () => setVariant(button.dataset.variant)));
function cycleVariant(direction) { setVariant('ABC'[('ABC'.indexOf(variant) + direction + 3) % 3]); }
$('#previous-variant').addEventListener('click', () => cycleVariant(-1));
$('#next-variant').addEventListener('click', () => cycleVariant(1));
function stepStop(direction) {
  return Math.max(0,Math.min(4,direction<0 ? Math.ceil(progress)-1 : Math.floor(progress)+1));
}
function updateStepControls() {
  document.querySelectorAll('[data-route-step]').forEach(button=>button.disabled=stepStop(Number(button.dataset.routeStep))===progress);
}
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && document.body.dataset.approaching) { cancelApproach(); return; }
  if (detail.open || event.target.closest('input,textarea,select,[contenteditable],nav')) return;
  if (['PageDown','PageUp','Home','End'].includes(event.key) || (event.key===' ' && event.target===document.body)) {
    event.preventDefault();
    if (document.body.dataset.approaching || document.body.dataset.returning) return;
    const index = event.key==='Home' ? 0 : event.key==='End' ? 4 : stepStop(event.key==='PageUp' || event.shiftKey ? -1 : 1);
    goToStop(Math.max(0,Math.min(4,index)));
    return;
  }
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    cycleVariant(event.key === 'ArrowLeft' ? -1 : 1);
  }
});

async function goToStop(index, focus = true, immediate = false) {
  if (document.body.dataset.approaching) await cancelApproach();
  if (detail.open || document.body.dataset.returning) return;
  clearTimeout(snapTimer); scrollDirection = 0;
  const max = document.documentElement.scrollHeight - innerHeight;
  scrollTo({ top: index / 4 * max, behavior: isReduced() || immediate ? 'instant' : 'smooth' });
  if (isReduced() || immediate) { routeImmediate = true; updateRoute(); routeImmediate = false; }
  if (focus) $('#briefing-title').focus({ preventScroll: true });
}
document.addEventListener('click', event => {
  const destination = event.target.closest('[data-stop]');
  if (destination && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
    event.preventDefault();
    goToStop(Number(destination.dataset.stop));
  }
  const moon = event.target.closest('[data-project]');
  if (moon) openMoon(Number(moon.dataset.project), moon);
  const step = event.target.closest('[data-route-step]');
  if (step) goToStop(stepStop(Number(step.dataset.routeStep)));
  if (event.target.closest('[data-retry-source]')) { sourceError = false; loadSource().catch(sourceFailure); }
});

const picks = () => `<div class="project-picks">${projects.map((project, i) => `<button type="button" data-project="${i}"><span class="moon-dot" aria-hidden="true"></span><span>${project.name}</span></button>`).join('')}</div>`;
function renderStop(index, announce = true) {
  const previousStop = currentStop;
  currentStop = index;
  const views = [opening,
    `<p class="eyebrow">PLANET 01 / SELECTED WORK</p><h1 id="briefing-title" tabindex="-1">Proof,<br><em>in orbit.</em></h1><p class="body-copy">Four projects. Select a moon to inspect the work and its implementation evidence.</p>${projects.length ? picks() : sourceError ? '<p class="source-note" role="status">Project archives could not load. <a href="../index.html">Read the existing portfolio →</a></p><button type="button" class="button" data-retry-source>Retry archives</button>' : '<p class="source-note">Loading project archives…</p>'}<p class="source-note">Optional moon visits. Your place in the journey is saved.</p>`,
    `<p class="eyebrow">PLANET 02 / CAPABILITIES</p><h1 id="briefing-title" tabindex="-1">From interface<br><em>to application.</em></h1><p class="body-copy">The skills used in the projects, organized by the work they support.</p><div class="capability-list"><div class="capability-row"><h2>Web interfaces</h2><p>React, TypeScript, JavaScript, HTML / CSS, Tailwind CSS</p></div><div class="capability-row"><h2>APIs &amp; application data</h2><p>Node.js, Express, Supabase, PostgreSQL, MySQL</p></div><div class="capability-row"><h2>Connected systems &amp; delivery</h2><p>REST APIs, MQTT, Docker, Git</p></div></div>`,
    `<p class="eyebrow">PLANET 03 / ABOUT &amp; EXPERIENCE</p><h1 id="briefing-title" tabindex="-1">The person<br><em>at the controls.</em></h1><p class="body-copy">Muhammad Iman Nugraha. Jakarta-based Informatics graduate, UPN Veteran Jakarta, 2022–2026.</p><div class="experience-summary"><h2>Front-End Intern · Mantra</h2><p>Mar–Oct 2025 · Responsive interfaces, frontend validation, and API integration within a Laravel application.</p></div><p class="source-note">AI-assisted workflow: review changes, test behavior, understand the code.</p>`,
    `<p class="eyebrow">FINAL DESTINATION / CONTACT</p><h1 id="briefing-title" tabindex="-1">A new mission<br><em>starts here.</em></h1><p class="body-copy">Tell me what you would like to build. Let’s discuss your project.</p><div class="briefing-actions"><a class="button button-primary" href="mailto:imannnnugraha@gmail.com">Discuss a Project <span aria-hidden="true">↗</span></a></div><a class="email-address" href="mailto:imannnnugraha@gmail.com">imannnnugraha@gmail.com</a><div class="contact-links"><a href="https://github.com/Jokskuyy" target="_blank" rel="noopener noreferrer">GitHub ↗</a><a href="https://www.linkedin.com/in/muhammad-nugraha-9bb016286/" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a><a href="../output/pdf/muhammad-iman-nugraha-cv.pdf" download>CV ↓</a></div>`
  ];
  const titleFocused = document.activeElement?.id === 'briefing-title';
  $('#briefing-content').innerHTML = views[index];
  document.querySelectorAll('.project-picks button').forEach(button => button.disabled = document.body.dataset.travel === 'transit');
  if (titleFocused) $('#briefing-title').focus({ preventScroll: true });
  $('#briefing').scrollTop = 0;
  $('#guide-dialogue').textContent = dialogues[index];
  document.querySelectorAll('[data-stop]').forEach(link => {
    if (Number(link.dataset.stop) === index) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  updateStepControls();
  if (announce) $('#destination-announcement').textContent = `Arrived at ${stops[index]}.`;
  $('#prototype-state').textContent = stateText();
  if (previousStop >= 0 && previousStop !== index && !isReduced()) {
    const panel = $('#briefing-content');
    panel.getAnimations().forEach(animation => animation.cancel());
    panel.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}], {duration:520,easing:'cubic-bezier(.2,.7,.2,1)'});
    $('#guide-dialogue').animate([{opacity:.15},{opacity:1}], {duration:600});
  }
  scene?.render();
}

function arriveAtStop(index) {
  if (index !== currentStop) renderStop(index, false);
  crossedStop = null;
  sectionTravel = index;
  document.body.dataset.travel = 'holding';
  $('.officer').dataset.state = index === 0 ? 'idle' : 'explaining';
  $('#travel-status').textContent = 'HOLDING POSITION';
  document.querySelectorAll('.project-picks button').forEach(button => button.disabled = false);
  document.querySelectorAll('.route-track b').forEach((dot,i) => dot.classList.toggle('reached',i<=index));
  history.replaceState(null,'',`${location.pathname}${location.search}#${slugs[index]}`);
  $('#destination-announcement').textContent = `Arrived at ${stops[index]}.`;
}
function crossedStation(from, to) {
  const stop=to>from ? Math.floor(to) : Math.ceil(to);
  return (to>from ? stop>from : stop<from) ? stop : null;
}
function syncSection(value) {
  const index=crossedStation(sectionTravel, value);
  sectionTravel=value;
  if (index===null || index===currentStop) return;
  renderStop(index, false);
  history.replaceState(null,'',`${location.pathname}${location.search}#${slugs[index]}`);
  $('#destination-announcement').textContent = `Passing ${stops[index]}.`;
}
function updateRoute() {
  if (detail.open || document.body.dataset.approaching || document.body.dataset.returning) return;
  const max = document.documentElement.scrollHeight - innerHeight;
  const previousProgress=progress;
  progress = Math.max(0, Math.min(4, scrollY / Math.max(1, max) * 4));
  const index = Math.round(progress), atStop = Math.abs(progress-index)<=4/Math.max(1,max);
  if (atStop) progress=index; // A station can fall between native scroll pixels.
  const crossed=crossedStation(previousProgress, progress);
  if (crossed!==null) crossedStop=crossed;
  if (!scene || sceneFailed || routeImmediate || isReduced()) syncSection(progress);
  const percent = Math.round(progress / 4 * 100);
  updateStepControls();
  $('#route-percent').innerHTML = `${percent}<span>%</span>`;
  $('#route-fill').style.width = `${percent}%`;
  if (!atStop || index !== currentStop) {
    document.body.dataset.travel = 'transit';
    $('#travel-status').textContent = 'IN TRANSIT';
    $('.officer').dataset.state = 'traveling';
    document.querySelectorAll('.project-picks button').forEach(button => button.disabled = true);
  }
  if (atStop && (!scene || sceneFailed || routeImmediate || isReduced())) arriveAtStop(index);
  scene?.setProgress(progress, routeImmediate || isReduced());
}
addEventListener('scroll',()=>{
  const change=scrollY-lastScrollY; lastScrollY=scrollY;
  updateRoute();
  if (!change) return;
  scrollDirection=Math.sign(change);
  clearTimeout(snapTimer); snapTimer=setTimeout(finishScroll,280);
},{passive:true});
function finishScroll() {
  clearTimeout(snapTimer);
  if (detail.open || document.body.dataset.approaching || document.body.dataset.returning) return;
  const value=progress;
  if (value===Math.round(value)) return;
  // A crossed planet remains the landing target; leaving a parked one is free.
  const stop=crossedStop!==null && Math.abs(value-crossedStop)<=.22 ? crossedStop : scrollDirection<0 ? Math.floor(value) : Math.ceil(value);
  if (Math.abs(value-stop)<=.22) goToStop(stop,false);
  else $('#travel-status').textContent='FREE FLIGHT';
}
addEventListener('resize',()=>{
  if (detail.open || document.body.dataset.approaching || document.body.dataset.returning) {
    savedScroll=currentStop/4*(document.documentElement.scrollHeight-innerHeight);
    return;
  }
  clearTimeout(snapTimer);
  scrollTo({top:progress/4*(document.documentElement.scrollHeight-innerHeight),behavior:'instant'});
  lastScrollY=scrollY;
  routeImmediate=true; updateRoute(); routeImmediate=false;
  snapTimer=setTimeout(finishScroll,280);
});

async function loadSource() {
  const sourceURL = new URL('../index.html', location.href);
  const response = await fetch(sourceURL);
  if (!response.ok) throw new Error(`Portfolio source: ${response.status}`);
  source = new DOMParser().parseFromString(await response.text(), 'text/html');
  source.querySelectorAll('[href],[src]').forEach(node => {
    for (const attribute of ['href', 'src']) if (node.hasAttribute(attribute)) node.setAttribute(attribute, new URL(node.getAttribute(attribute), sourceURL).href);
  });
  projects = [...source.querySelectorAll('[data-build]')].map(node => ({ name: node.querySelector('.project-title').textContent.trim(), node }));
  renderStop(currentStop, false);
  scene?.render();
}
async function openMoon(index, origin) {
  if (!projects[index] || detail.open || document.body.dataset.approaching || document.body.dataset.returning) return;
  const request = ++moonRequest;
  returnFocus = origin;
  savedScroll = scrollY;
  document.body.style.overflow = 'hidden';
  document.body.dataset.approaching = 'true';
  $('.officer').dataset.state = 'traveling';
  $('#travel-status').textContent = 'APPROACHING · ESC TO CANCEL';
  await scene?.setMoon(index);
  if (request !== moonRequest || !document.body.dataset.approaching) return;
  const project = projects[index];
  $('#detail-heading').textContent = project.name;
  const article = project.node.cloneNode(true);
  article.hidden = false;
  article.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
  article.removeAttribute('id');
  article.querySelectorAll('details').forEach(node => node.open = true);
  $('#detail-content').replaceChildren(article);
  detail.showModal();
  if (!isReduced()) detail.animate([{opacity:0,transform:'translateX(-8px)'},{opacity:1,transform:'translateX(0)'}], {duration:420,easing:'cubic-bezier(.2,.7,.2,1)'});
  detail.scrollTop = 0;
  $('#return-to-planet').focus();
  $('.officer').dataset.state = 'explaining';
  $('#travel-status').textContent = 'READING PROJECT';
  delete document.body.dataset.approaching;
}
async function returnFromMoon() {
  document.body.dataset.returning = 'true';
  delete document.body.dataset.approaching;
  document.body.style.overflow = '';
  scrollTo({ top: savedScroll, behavior: 'instant' });
  returnFocus?.focus({ preventScroll: true });
  $('#travel-status').textContent = 'RETURNING TO ROUTE';
  await scene?.setMoon(null);
  scrollTo({ top: savedScroll, behavior: 'instant' });
  delete document.body.dataset.returning;
  arriveAtStop(currentStop);
  updateRoute();
}
function cancelApproach() { moonRequest++; return returnFromMoon(); }
$('#return-to-planet').addEventListener('click', () => detail.close());
detail.addEventListener('close', returnFromMoon);

// The content and controls initialize before the optional 3D module.
renderStop(0, false);
setVariant(new URLSearchParams(location.search).get('variant') || 'A');
function sourceFailure(error) { console.error(error); sourceError = true; renderStop(currentStop, false); }
loadSource().catch(sourceFailure);
$('#retry-scene').addEventListener('click', () => {
  const url = new URL(location.href);
  url.searchParams.delete('scene');
  history.replaceState(null, '', url);
  location.reload();
});
function sceneFailure() {
  sceneFailed = true;
  $('#scene-status').hidden = false;
  $('#scene-status span').textContent = '3D is unavailable. You can still explore the content.';
  $('#retry-scene').hidden = false;
  $('#window-mode').textContent = 'TEXT VIEW';
  updateRoute();
}

async function createScene() {
  if (new URLSearchParams(location.search).get('scene') === 'off') throw new Error('3D disabled for fallback preview');
  const THREE = await import('./vendor/three/three.module.js');
  const { flightCurve, planetSpecs, moonOffsets, sampleFlight, scrollToTravel, dampTravel, moonTour, travelToDistance, traceDrop } = await import('./flight-path.js?v=20261018-flow-v8');
  const host = $('#space');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0x050b17, 0);
  host.append(renderer.domElement);
  const world = new THREE.Scene();
  world.fog = new THREE.FogExp2(0x050b17, .005);
  const camera = new THREE.PerspectiveCamera(43, 1, .1, 160);
  world.add(new THREE.AmbientLight(0x8cacc6, 1.35));
  const key = new THREE.DirectionalLight(0xffead1, 3.3); key.position.set(-8, 7, 12); world.add(key);
  const fill = new THREE.DirectionalLight(0x4c7d98, .7); fill.position.set(8, -2, -12); world.add(fill);
  // One fixed star field: depth and parallax come from the ship's winding path.
  let seed = 54;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const starGeometry = new THREE.BufferGeometry(), starPositions = [];
  for (let i = 0; i < 2200; i++) starPositions.push((random() - .5) * 240, (random() - .5) * 150, 80 - random() * 340);
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  world.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xc7dadb, size: .075, transparent: true, opacity: .7, sizeAttenuation: true })));
  // A distant layer keeps small ambient details available throughout the route.
  // Planet geometry still occludes it; the cockpit and content stay in front.
  const ambient = new THREE.Group(); world.add(ambient);
  const rockGeometry = new THREE.IcosahedronGeometry(1, 0);
  const rockVertices = rockGeometry.attributes.position;
  for (let i=0;i<rockVertices.count;i++) {
    const x=rockVertices.getX(i), y=rockVertices.getY(i), z=rockVertices.getZ(i);
    const roughness=.86+Math.sin(x*5.7+y*8.3+z*3.2)*.16;
    rockVertices.setXYZ(i,x*roughness,y*roughness,z*roughness);
  }
  rockGeometry.computeVertexNormals();
  const asteroids = new THREE.InstancedMesh(rockGeometry,new THREE.MeshStandardMaterial({roughness:1,flatShading:true}),12);
  asteroids.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  asteroids.frustumCulled=false;
  ambient.add(asteroids);
  const rocks = Array.from({length:12},(_,i)=>{
    asteroids.setColorAt(i,new THREE.Color().setHSL(.11+random()*.05,.09,.30+random()*.14));
    return {x:random()*84-42,y:random()*29-10,z:-68-random()*36,size:.25+random()*.65,speed:.45+random()*.65,phase:random()*Math.PI*2};
  });
  const rockPose = new THREE.Object3D();
  const meteorGeometry = new THREE.BufferGeometry(), meteorVertices=[], meteorColors=[];
  for(let i=0;i<8;i++) {
    const fraction=i/7, light=(1-fraction)**2;
    meteorVertices.push(-fraction*5.5,fraction*2.3,0);
    meteorColors.push(light*.78,light*.93,light);
  }
  meteorGeometry.setAttribute('position',new THREE.Float32BufferAttribute(meteorVertices,3));
  meteorGeometry.setAttribute('color',new THREE.Float32BufferAttribute(meteorColors,3));
  const meteors = Array.from({length:2},()=>{
    const meteor = new THREE.Line(meteorGeometry,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
    ambient.add(meteor); return meteor;
  });
  let ambientTime=0;
  function updateAmbient(seconds,minimal) {
    if (!minimal) ambientTime+=seconds;
    ambient.position.copy(camera.position); ambient.quaternion.copy(camera.quaternion);
    const horizontalSlope=Math.tan(THREE.MathUtils.degToRad(camera.fov*.5))*camera.aspect*1.1;
    rocks.forEach((rock,i)=>{
      const edge=-rock.z*horizontalSlope+rock.size*2, span=edge*2;
      rockPose.position.set(THREE.MathUtils.euclideanModulo(rock.x+ambientTime*rock.speed+edge,span)-edge,rock.y+Math.sin(ambientTime*.13+rock.phase)*.65,rock.z);
      rockPose.rotation.set(rock.phase+ambientTime*.08,rock.phase+ambientTime*.055,rock.phase);
      rockPose.scale.set(rock.size,rock.size*.7,rock.size*1.2);
      rockPose.updateMatrix(); asteroids.setMatrixAt(i,rockPose.matrix);
    });
    asteroids.instanceMatrix.needsUpdate=true;
    meteors.forEach((meteor,i)=>{
      const cycle=9+i*3.6, phase=(ambientTime+i*4.8)%cycle, fraction=phase/1.35;
      meteor.visible=!minimal && fraction<1;
      if (!meteor.visible) return;
      const lane=Math.sin(Math.floor((ambientTime+i*4.8)/cycle)*2.4+i)*9;
      meteor.position.set(-30+lane+36*fraction,16-i*6-14*fraction,-76-i*15);
      meteor.material.opacity=Math.sin(Math.PI*fraction)*.85;
    });
  }
  // A pilot-eye route ribbon, rising into the destination at its endpoint.
  const trace = new THREE.Group(); world.add(trace);
  const traceProgress = { value:0 }, tracePhase = { value:0 };
  for (const [radius, opacity] of [[.055,.72],[.18,.12]]) {
    const geometry = new THREE.TubeGeometry(flightCurve, 320, radius, 6, false);
    const vertices = geometry.attributes.position, uv = geometry.attributes.uv;
    for (let i=0;i<vertices.count;i++) vertices.setY(i, vertices.getY(i) - traceDrop(uv.getX(i)));
    geometry.computeBoundingSphere();
    trace.add(new THREE.Mesh(geometry, new THREE.ShaderMaterial({
      uniforms:{ progress:traceProgress, phase:tracePhase, strength:{value:opacity} },
      vertexShader:'varying float along; void main(){ along=uv.x; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader:`
        varying float along; uniform float progress; uniform float phase; uniform float strength;
        void main(){
          float ahead=smoothstep(progress+.004,progress+.025,along);
          float distanceFade=1.0-smoothstep(progress+.20,progress+.43,along);
          float glint=pow(.5+.5*sin(along*240.0-phase*3.0),10.0);
          vec3 color=mix(vec3(.40,.77,.69),vec3(.91,1.0,.84),glint);
          gl_FragColor=vec4(color,ahead*distanceFade*(.30+glint*.70)*strength);
        }`,
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending
    })));
  }
  const planetGeometry = new THREE.SphereGeometry(1, 56, 36), moonGeometry = new THREE.IcosahedronGeometry(.32, 2);
  const palettes = [['#275358','#4e8580','#8eaa85','#cad1af'],['#3b485b','#73838c','#a4b8ab','#c7c8ab'],['#533e38','#966b4e','#b69667','#d4bc91'],['#344749','#647d6b','#adc19b','#d1d2ad']];
  function surface(palette, index) {
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 128;
    const context = canvas.getContext('2d');
    for (let y = 0; y < 128; y++) for (let x = 0; x < 256; x++) {
      const u = x / 256 * Math.PI * 2, v = y / 128 * Math.PI;
      const noise = Math.sin(u * 3.2 + Math.cos(v * 5)) + Math.sin(u * 7 + v * 8) * .5 + Math.cos(u * 17 - v * 13) * .22 + Math.sin(u * 31 + v * 25) * .1;
      const value = index === 3 ? Math.sin(v * 19 + Math.sin(u * 4) * .4) + noise * .3 : noise;
      const level = Math.max(0, Math.min(3, Math.floor((value + 1.65) / 3.3 * 4)));
      context.fillStyle = palette[level]; context.fillRect(x, y, 1, 1);
    }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    return texture;
  }
  const moons = [];
  palettes.forEach((palette, i) => {
    const spec = planetSpecs[i];
    const system = new THREE.Group(); system.position.copy(spec.position); world.add(system);
    const planet = new THREE.Mesh(planetGeometry, new THREE.MeshStandardMaterial({ map: surface(palette, i), roughness: .94 }));
    planet.scale.setScalar(spec.radius);
    planet.rotation.set(.12 + i * .09, .6 + i, spec.tilt); system.add(planet);
    const atmosphere = new THREE.Mesh(planetGeometry, new THREE.ShaderMaterial({
      uniforms: { tint: { value: new THREE.Color(palette[2]) } },
      vertexShader: 'varying vec3 n; varying vec3 v; void main(){ vec4 p=modelViewMatrix*vec4(position,1.0); n=normalize(normalMatrix*normal); v=normalize(-p.xyz); gl_Position=projectionMatrix*p; }',
      fragmentShader: 'uniform vec3 tint; varying vec3 n; varying vec3 v; void main(){ float a=pow(1.0-abs(dot(normalize(n),normalize(v))),3.5)*0.32; gl_FragColor=vec4(tint,a); }',
      transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending
    })); atmosphere.scale.setScalar(spec.radius * 1.055); system.add(atmosphere);
    if (i === 0 || i === 3) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(spec.radius * 1.25, spec.radius * 1.85, 96), new THREE.MeshBasicMaterial({ color: i === 0 ? 0xa6bda2 : 0xb3a286, transparent: true, opacity: .25, side: THREE.DoubleSide, depthWrite: false }));
      ring.rotation.set(1.05, .18, spec.tilt); system.add(ring);
    }
    if (i === 0) {
      moonOffsets.forEach((position,j) => {
        const moon = new THREE.Mesh(moonGeometry, new THREE.MeshStandardMaterial({ color: [0xabb4a0,0x8c9eac,0xbbaa86,0x9b9eae][j], roughness: 1 })); moon.position.copy(position); system.add(moon); moons.push(moon);
      });
    }
  });
  let travel = scrollToTravel(progress), targetTravel = travel, selectedMoon = null;
  let frame = 0, lastFrame = 0, lost = false, operation = null, path = null, pathProgress = 0;
  const focus = new THREE.Vector3(), moonPosition = new THREE.Vector3();
  const homePosition = new THREE.Vector3(), homeRotation = new THREE.Quaternion();
  const homeRight = new THREE.Vector3();
  const lookMatrix = new THREE.Matrix4(), lookRotation = new THREE.Quaternion();
  const viewOffset = new THREE.Euler(), viewRotation = new THREE.Quaternion();
  const pointer = new THREE.Vector2(), pointerTarget = new THREE.Vector2();

  function render() { if (!frame && !lost && !document.hidden) frame = requestAnimationFrame(draw); }
  function draw(time) {
    frame = 0;
    if (lost) return;
    const seconds = lastFrame ? Math.min((time - lastFrame) / 1000, .05) : 1 / 60;
    lastFrame = time;
    const minimal = isReduced();
    if (minimal) pointerTarget.set(0,0);
    pointer.x = minimal ? 0 : THREE.MathUtils.damp(pointer.x, pointerTarget.x, 8, seconds);
    pointer.y = minimal ? 0 : THREE.MathUtils.damp(pointer.y, pointerTarget.y, 8, seconds);
    let completed;
    if (operation) {
      operation.started ??= time;
      const elapsed = minimal ? 1 : Math.min(1, (time - operation.started) / operation.duration);
      pathProgress = THREE.MathUtils.lerp(operation.from, operation.to, THREE.MathUtils.smootherstep(elapsed, 0, 1));
      if (elapsed === 1) { completed = operation.resolve; operation = null; }
    }
    if (path) {
      path.getPoint(pathProgress, camera.position);
      moons[selectedMoon].getWorldPosition(moonPosition);
      focus.copy(moonPosition).addScaledVector(homeRight, -.6);
      lookRotation.setFromRotationMatrix(lookMatrix.lookAt(camera.position, focus, camera.up));
      camera.quaternion.copy(homeRotation).slerp(lookRotation, THREE.MathUtils.smootherstep(pathProgress, 0, .65));
      if (!operation && pathProgress === 0) { path = null; selectedMoon = null; }
    } else {
      travel = dampTravel(travel, targetTravel, seconds, minimal);
      sampleFlight(travel, camera.position, camera.quaternion);
      const bank = minimal ? 0 : Math.sin((travel % 1) * Math.PI * 2) * .018;
      viewOffset.set(-pointer.y * .008, pointer.x * .012, bank, 'YXZ');
      camera.quaternion.multiply(viewRotation.setFromEuler(viewOffset));
    }
    trace.visible = !path && travel < 3.995;
    traceProgress.value = travelToDistance(travel);
    if (!minimal) tracePhase.value += seconds;
    else tracePhase.value = 0;
    updateAmbient(seconds,minimal);
    renderer.render(world, camera);
    if (!path && !operation) syncSection(travel);
    const stop = Math.round(travel);
    if (!path && !operation && Math.abs(travel-stop)<.0002 && Math.abs(targetTravel-stop)<.0002 && (currentStop!==stop || document.body.dataset.travel!=='holding')) arriveAtStop(stop);
    completed?.(true);
    if (!minimal || operation || (!path && Math.abs(travel - targetTravel) > .00001) || Math.abs(pointer.x - pointerTarget.x) > .001 || Math.abs(pointer.y - pointerTarget.y) > .001) render();
    else lastFrame = 0;
  }
  function resize() {
    const { width, height } = host.getBoundingClientRect();
    renderer.setSize(width, height, false); camera.aspect = width / height;
    camera.setViewOffset(width, height, variant === 'A' ? -width * .03 : 0, height * .08, width, height);
    camera.updateProjectionMatrix(); render();
  }
  function setMoon(index) {
    operation?.resolve(false);
    if (lost) return Promise.resolve(true);
    if (index !== null) {
      selectedMoon = index;
      homePosition.copy(camera.position); homeRotation.copy(camera.quaternion);
      homeRight.set(1,0,0).applyQuaternion(homeRotation);
      moons[index].getWorldPosition(moonPosition);
      path = moonTour(homePosition, moonPosition); pathProgress = 0;
    }
    if (!path) return Promise.resolve(true);
    return new Promise(resolve => {
      operation = { from:pathProgress, to:index === null ? 0 : 1, duration:index === null ? 950 : 1450, resolve };
      render();
    });
  }
  addEventListener('resize', resize);
  reduced.addEventListener('change', render);
  $('#cockpit').addEventListener('pointermove', event => {
    if (isReduced() || detail.open || path) return;
    const bounds = host.getBoundingClientRect();
    pointerTarget.set(THREE.MathUtils.clamp((event.clientX - bounds.left) / bounds.width * 2 - 1, -1, 1), THREE.MathUtils.clamp((event.clientY - bounds.top) / bounds.height * 2 - 1, -1, 1));
    render();
  });
  $('#cockpit').addEventListener('pointerleave', () => { pointerTarget.set(0,0); render(); });
  addEventListener('visibilitychange', () => { lastFrame = 0; if (!document.hidden) render(); });
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault(); lost = true; cancelAnimationFrame(frame); frame = 0;
    operation?.resolve(true); operation = null; sceneFailure();
  });
  resize();
  $('#scene-status').hidden = true;
  $('#window-mode').textContent = '3D ONLINE';
  sceneFailed = false;
  return { resize, render, setProgress(value, immediate = false) { targetTravel = scrollToTravel(value); if (immediate) travel = targetTravel; render(); }, setMoon };
}
createScene().then(result => { scene = result; updateRoute(); }).catch(error => {
  if (!String(error).includes('fallback preview')) console.error(error);
  sceneFailure();
});
const initialStop = slugs.indexOf(location.hash.slice(1));
history.scrollRestoration = 'manual';
requestAnimationFrame(() => goToStop(Math.max(0, initialStop), false, true));
addEventListener('hashchange', () => {
  const index = slugs.indexOf(location.hash.slice(1));
  if (index >= 0 && !detail.open) goToStop(index, false, true);
});
