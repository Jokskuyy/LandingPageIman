import { createOrbitalIntro } from './orbital-intro.js?v=20261027-orbital-v3';

// Three layouts of the same real portfolio. Read-only prototype, not production.
const $ = selector => document.querySelector(selector);
const recoveringScene = history.state?.recoverScene === true;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let calm = false;
const isReduced = () => reduced.matches || calm;
const stops = ['Opening', 'Selected work', 'Capabilities', 'About & experience', 'Contact'];
const slugs = ['opening', 'selected-work', 'capabilities', 'about-experience', 'contact'];
const variants = { A: 'Panoramic bridge', B: 'Command console', C: 'Navigation chart' };
const opening = $('#briefing-content').innerHTML;
let variant = 'A', currentStop = -1, progress = 0, sectionTravel = 0, source, sourceError = false, projects = [], scene;
let routeImmediate = false, sceneFailed = false, returnFocus, savedScroll = 0, moonRequest = 0;
let snapTimer, scrollDirection = 0, lastScrollY = scrollY, crossedStop = null;
const detail = $('#project-detail');
const moonAccents = ['#81cae8','#78e6bc','#ffb56d','#c3b5ff'];
const intro = createOrbitalIntro({ onHandoff() {
  announceDestination(`Arrived at ${stops[currentStop]}.`);
} });
const bridgeParts = { interior:null, source:null, scene:null };
function settleBridge(part, fallback = false) {
  bridgeParts[part] = fallback ? 'fallback' : 'ready';
  if (Object.values(bridgeParts).every(Boolean)) intro.setReady(Object.values(bridgeParts).includes('fallback'));
}
function announceDestination(message) {
  if (!intro.active) $('#destination-announcement').textContent = message;
}
const interior = $('#cockpit-interior');
function settleInterior() {
  if (bridgeParts.interior) return;
  clearTimeout(interiorDeadline);
  interior.removeEventListener('load', settleInterior);
  interior.removeEventListener('error', settleInterior);
  const failed = !interior.complete || !interior.naturalWidth;
  if (failed) $('#cockpit').dataset.interior = 'fallback';
  settleBridge('interior', failed);
}
const interiorDeadline = setTimeout(settleInterior, 8000);
interior.addEventListener('load', settleInterior);
interior.addEventListener('error', settleInterior);
if (interior.complete) settleInterior();
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
  if (intro.locked) return;
  if (event.key === 'Escape' && document.body.dataset.approaching) { cancelApproach(); return; }
  if (detail.open || event.target===$('#briefing') || event.target.closest('input,textarea,select,[contenteditable],nav')) return;
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
  if (intro.locked && !immediate) return;
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

const picks = () => `<div class="project-picks">${projects.map((project, i) => `<button type="button" data-project="${i}" style="--moon:${moonAccents[i]}"><span class="moon-dot" aria-hidden="true"></span><span>${project.name}</span></button>`).join('')}</div>`;
for (const type of ['pointerover','focusin']) $('#briefing-content').addEventListener(type, event => {
  const button=event.target.closest('[data-project]');
  if (button && !button.disabled) scene?.highlightMoon(Number(button.dataset.project),type==='focusin'?'focus':'pointer');
});
for (const type of ['pointerout','focusout']) $('#briefing-content').addEventListener(type, event => {
  const button=event.target.closest('[data-project]');
  if (button && !button.contains(event.relatedTarget)) scene?.highlightMoon(null,type==='focusout'?'focus':'pointer');
});
function frameNavigation() {
  const navigation=$('.destination-nav'), active=navigation.querySelector('[aria-current]');
  if (active && navigation.scrollWidth>navigation.clientWidth) navigation.scrollTo({left:active.offsetLeft-(navigation.clientWidth-active.clientWidth)/2,behavior:isReduced()?'instant':'smooth'});
}
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
  document.querySelectorAll('[data-stop]').forEach(link => {
    if (Number(link.dataset.stop) === index) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  frameNavigation();
  updateStepControls();
  if (announce) announceDestination(`Arrived at ${stops[index]}.`);
  $('#prototype-state').textContent = stateText();
  if (!intro.active && previousStop >= 0 && previousStop !== index && !isReduced()) {
    const panel = $('#briefing-content');
    panel.getAnimations().forEach(animation => animation.cancel());
    panel.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}], {duration:520,easing:'cubic-bezier(.2,.7,.2,1)'});
  }
  scene?.render();
}

function arriveAtStop(index) {
  if (index !== currentStop) renderStop(index, false);
  crossedStop = null;
  sectionTravel = index;
  document.body.dataset.travel = 'holding';
  $('#travel-status').textContent = 'HOLDING POSITION';
  document.querySelectorAll('.project-picks button').forEach(button => button.disabled = false);
  document.querySelectorAll('.route-track b').forEach((dot,i) => dot.classList.toggle('reached',i<=index));
  history.replaceState(null,'',`${location.pathname}${location.search}#${slugs[index]}`);
  announceDestination(`Arrived at ${stops[index]}.`);
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
  announceDestination(`Passing ${stops[index]}.`);
}
function updateRoute() {
  if (intro.locked && !routeImmediate) return;
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
    document.querySelectorAll('.project-picks button').forEach(button => button.disabled = true);
  }
  if (atStop && (!scene || sceneFailed || routeImmediate || isReduced())) arriveAtStop(index);
  scene?.setProgress(progress, routeImmediate || isReduced());
}
addEventListener('scroll',()=>{
  const change=scrollY-lastScrollY; lastScrollY=scrollY;
  if (intro.locked) { clearTimeout(snapTimer); return; }
  updateRoute();
  if (!change) return;
  scrollDirection=Math.sign(change);
  clearTimeout(snapTimer); snapTimer=setTimeout(finishScroll,280);
},{passive:true});
function finishScroll() {
  clearTimeout(snapTimer);
  if (intro.locked) return;
  if (detail.open || document.body.dataset.approaching || document.body.dataset.returning) return;
  const value=progress;
  if (value===Math.round(value)) return;
  // A crossed planet remains the landing target; leaving a parked one is free.
  const stop=crossedStop!==null && Math.abs(value-crossedStop)<=.22 ? crossedStop : scrollDirection<0 ? Math.floor(value) : Math.ceil(value);
  if (Math.abs(value-stop)<=.22) goToStop(stop,false);
  else $('#travel-status').textContent='FREE FLIGHT';
}
addEventListener('resize',()=>{
  frameNavigation();
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
  const response = await fetch(sourceURL, { signal:AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`Portfolio source: ${response.status}`);
  source = new DOMParser().parseFromString(await response.text(), 'text/html');
  source.querySelectorAll('[href],[src]').forEach(node => {
    for (const attribute of ['href', 'src']) if (node.hasAttribute(attribute)) node.setAttribute(attribute, new URL(node.getAttribute(attribute), sourceURL).href);
  });
  projects = [...source.querySelectorAll('[data-build]')].map(node => ({ name: node.querySelector('.project-title').textContent.trim(), node }));
  renderStop(currentStop, false);
  settleBridge('source');
  scene?.render();
}
async function openMoon(index, origin) {
  if (intro.locked) return;
  if (!projects[index] || detail.open || document.body.dataset.approaching || document.body.dataset.returning) return;
  const request = ++moonRequest;
  returnFocus = origin;
  savedScroll = scrollY;
  document.body.style.overflow = 'hidden';
  document.body.dataset.approaching = 'true';
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
function sourceFailure(error) { console.error(error); sourceError = true; renderStop(currentStop, false); settleBridge('source', true); }
loadSource().catch(sourceFailure);
$('#retry-scene').addEventListener('click', () => {
  const url = new URL(location.href);
  url.searchParams.delete('scene');
  history.replaceState({ recoverScene: true }, '', url);
  location.reload();
});
function sceneFailure() {
  scene?.endIntro();
  sceneFailed = true;
  $('#scene-status').hidden = false;
  $('#scene-status span').textContent = '3D is unavailable. You can still explore the content.';
  $('#retry-scene').hidden = false;
  $('#window-mode').textContent = 'TEXT VIEW';
  settleBridge('scene', true);
  updateRoute();
}

async function createScene() {
  if (new URLSearchParams(location.search).get('scene') === 'off') throw new Error('3D disabled for fallback preview');
  const THREE = await import('./vendor/three/three.module.js');
  const { flightCurve, planetSpecs, moonOffsets, sampleFlight, scrollToTravel, dampTravel, frameWindow, moonTour, travelToDistance, traceDrop } = await import('./flight-path.js?v=20261019-responsive-v14');
  const { createProjectMoons } = await import('./project-moons.js?v=20261019-moons-v13');
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
  const planetGeometry = new THREE.SphereGeometry(1, 56, 36);
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
  const projectMoons=createProjectMoons(moonOffsets,moonAccents), moons=projectMoons.moons;
  const planetSystems = [];
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
    if (i === 0) system.add(projectMoons.group);
    planetSystems.push(system);
  });
  // One renderer and the same planet geometry/materials serve both views.
  // Only the intro's transforms and camera are temporary; the bridge stays parked.
  let orbitalView;
  function beginIntro(introHost, visual) {
    if (lost || orbitalView) return;
    const orbitalWorld = new THREE.Scene();
    world.children.filter(child => child.isLight).forEach(light => orbitalWorld.add(light.clone()));
    const orbitalCamera = new THREE.OrthographicCamera(-1,1,1,-1,.1,2000);
    orbitalCamera.position.z = 800;
    const layout = [
      { index:0, x:.73, y:.54, radius:.115, delay:.32, depth:1.3 },
      { index:2, x:.25, y:.59, radius:.063, delay:.48, depth:.9 },
      { index:1, x:.36, y:.25, radius:.033, delay:.62, depth:.5 },
      { index:3, x:.78, y:.25, radius:.022, delay:.73, depth:.3 }
    ];
    const bodies = layout.map(spec => {
      const body = new THREE.Group();
      // Mesh clones keep the existing GPU buffers and procedural surfaces.
      planetSystems[spec.index].children.filter(child => child.isMesh).forEach(child => body.add(child.clone()));
      orbitalWorld.add(body);
      return { ...spec, body };
    });
    let resolveWarmup;
    const prepared = new Promise(resolve => { resolveWarmup = resolve; });
    orbitalView = { world:orbitalWorld, camera:orbitalCamera, host:introHost, visual, bodies, time:0, resolveWarmup };
    introHost.style.visibility = 'hidden';
    introHost.append(renderer.domElement);
    resize();
    return prepared;
  }
  function endIntro() {
    if (!orbitalView) return;
    orbitalView.resolveWarmup?.(false);
    orbitalView.world.clear();
    orbitalView = null;
    renderer.renderLists.dispose();
    host.append(renderer.domElement);
    pointer.set(0,0); pointerTarget.set(0,0); lastFrame = 0;
    resize();
    // Paint the exact route viewpoint before the aperture starts opening.
    cancelAnimationFrame(frame); frame = 0; draw(performance.now());
  }
  function drawOrbital(seconds, minimal) {
    const view = orbitalView, { visual } = view;
    if (!minimal) view.time += seconds;
    for (const spec of view.bodies) {
      // Warm every planet/material before its timed entrance, including
      // bodies that were outside the cockpit camera's initial frustum.
      const reveal = view.resolveWarmup ? 1 : THREE.MathUtils.smoothstep(visual.progress,spec.delay,spec.delay+.2);
      spec.body.visible = reveal > 0;
      const radius = Math.min(width*.1,height*spec.radius);
      spec.body.scale.setScalar(radius / planetSpecs[spec.index].radius * (.88 + reveal*.12));
      spec.body.position.set((spec.x-.5)*width + (minimal?0:visual.x*12*spec.depth),
        (.5-spec.y)*height - (1-reveal)*18 + (minimal?0:visual.y*8*spec.depth + Math.sin(view.time*.25+spec.index)*3),spec.depth*10);
      spec.body.rotation.y = minimal ? 0 : view.time*.025*(spec.index%2?1:-1);
    }
    renderer.render(view.world,view.camera);
    if (view.resolveWarmup) {
      for (const spec of view.bodies) spec.body.visible = false;
      renderer.render(view.world,view.camera);
      view.host.style.visibility = '';
      view.resolveWarmup(true);
      view.resolveWarmup = null;
    }
    if (!minimal || visual.progress < 1) render();
    else lastFrame = 0;
  }
  let travel = scrollToTravel(progress), targetTravel = travel, selectedMoon = null;
  let frame = 0, lastFrame = 0, lost = false, operation = null, path = null, pathProgress = 0;
  let resolveFirstFrame, rejectFirstFrame;
  let firstPaint = true;
  const firstFrame = new Promise((resolve,reject) => { resolveFirstFrame=resolve; rejectFirstFrame=reject; });
  const focus = new THREE.Vector3(), moonPosition = new THREE.Vector3();
  const homePosition = new THREE.Vector3(), homeRotation = new THREE.Quaternion();
  const lookMatrix = new THREE.Matrix4(), lookRotation = new THREE.Quaternion();
  const viewOffset = new THREE.Euler(), viewRotation = new THREE.Quaternion();
  const pointer = new THREE.Vector2(), pointerTarget = new THREE.Vector2();
  const raycaster=new THREE.Raycaster(), mouse=new THREE.Vector2(), touchTarget=new THREE.Vector3();
  let highlightedMoon=null, pointedMoon=null, focusedMoon=null, width=0, height=0;

  function highlightMoon(index,source='pointer') {
    if (lost) { focusedMoon=pointedMoon=null; index=null; }
    if (source==='focus') { focusedMoon=index; if(index!==null) pointedMoon=null; }
    else pointedMoon=index;
    const next=pointedMoon ?? focusedMoon;
    $('#cockpit').style.cursor=pointedMoon===null?'':'pointer';
    if (highlightedMoon===next) return;
    highlightedMoon=next;
    document.querySelectorAll('.project-picks button').forEach((button,i)=>button.toggleAttribute('data-targeted',i===next));
    render();
  }
  function pickMoon(event) {
    if (lost || path || currentStop!==1 || document.body.dataset.travel!=='holding' || event.target.closest('a,button,summary,details,.briefing')) return null;
    const bounds=host.getBoundingClientRect();
    mouse.set((event.clientX-bounds.left)/bounds.width*2-1,1-(event.clientY-bounds.top)/bounds.height*2);
    raycaster.setFromCamera(mouse,camera);
    const hit=raycaster.intersectObjects(projectMoons.bodies,false)[0]?.object.userData.project;
    if (hit!==undefined) return hit;
    if (event.pointerType==='touch' || matchMedia('(pointer:coarse)').matches) {
      let closest=null, distance=24;
      moons.forEach((moon,index)=>{
        moon.getWorldPosition(touchTarget).project(camera);
        const pixels=Math.hypot((touchTarget.x+1)*bounds.width/2-(event.clientX-bounds.left),(1-touchTarget.y)*bounds.height/2-(event.clientY-bounds.top));
        if (touchTarget.z>-1 && touchTarget.z<1 && pixels<distance) { closest=index; distance=pixels; }
      });
      return closest;
    }
    return null;
  }
  function frameMoon(blend=0) {
    frameWindow(camera,width,height,variant,blend);
  }

  function render() { if (!frame && !lost && !document.hidden) frame = requestAnimationFrame(draw); }
  function draw(time) {
    frame = 0;
    if (lost) return;
    // Initial route selection can run while createScene awaits this frame.
    if (firstPaint) { travel = targetTravel = scrollToTravel(progress); firstPaint = false; }
    const seconds = lastFrame ? Math.min((time - lastFrame) / 1000, .05) : 1 / 60;
    lastFrame = time;
    const minimal = isReduced();
    if (orbitalView) {
      try { drawOrbital(seconds,minimal); }
      catch (error) { console.error(error); sceneFailure(); }
      return;
    }
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
      focus.copy(moonPosition);
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
    frameMoon(path?THREE.MathUtils.smootherstep(pathProgress,0,1):0);
    trace.visible = !path && travel < 3.995;
    traceProgress.value = travelToDistance(travel);
    if (!minimal) tracePhase.value += seconds;
    else tracePhase.value = 0;
    updateAmbient(seconds,minimal);
    projectMoons.update(ambientTime,camera,selectedMoon ?? highlightedMoon);
    try {
      renderer.render(world, camera);
      if (renderer.getContext().isContextLost()) throw new Error('Viewing window context lost');
      resolveFirstFrame();
    } catch (error) {
      lost = true; rejectFirstFrame(error); sceneFailure(); return;
    }
    if (!path && !operation) syncSection(travel);
    const stop = Math.round(travel);
    if (!path && !operation && Math.abs(travel-stop)<.0002 && Math.abs(targetTravel-stop)<.0002 && (currentStop!==stop || document.body.dataset.travel!=='holding')) arriveAtStop(stop);
    completed?.(true);
    if (!minimal || operation || (!path && Math.abs(travel - targetTravel) > .00001) || Math.abs(pointer.x - pointerTarget.x) > .001 || Math.abs(pointer.y - pointerTarget.y) > .001) render();
    else lastFrame = 0;
  }
  function resize() {
    ({width,height}=(orbitalView?.host || host).getBoundingClientRect());
    renderer.setPixelRatio(Math.min(devicePixelRatio,width<=700?1.25:1.5));
    renderer.setSize(width,height,false);
    if (orbitalView) {
      Object.assign(orbitalView.camera,{ left:-width/2, right:width/2, top:height/2, bottom:-height/2 });
      orbitalView.camera.updateProjectionMatrix();
    } else {
      frameMoon(path?THREE.MathUtils.smootherstep(pathProgress,0,1):0);
      camera.updateProjectionMatrix();
    }
    render();
  }
  function setMoon(index) {
    operation?.resolve(false);
    if (lost) return Promise.resolve(true);
    if (index !== null) {
      selectedMoon = index;
      homePosition.copy(camera.position); homeRotation.copy(camera.quaternion);
      moons[index].getWorldPosition(moonPosition);
      path = moonTour(homePosition, moonPosition,height>=width?4.2:6); pathProgress = 0;
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
    if (intro.locked) return;
    if (detail.open || path) return;
    const button=event.target.closest('[data-project]');
    highlightMoon(button && !button.disabled?Number(button.dataset.project):pickMoon(event));
    if (isReduced() || event.pointerType!=='mouse') return;
    const bounds = host.getBoundingClientRect();
    pointerTarget.set(THREE.MathUtils.clamp((event.clientX - bounds.left) / bounds.width * 2 - 1, -1, 1), THREE.MathUtils.clamp((event.clientY - bounds.top) / bounds.height * 2 - 1, -1, 1));
    render();
  });
  $('#cockpit').addEventListener('pointerleave', () => { pointerTarget.set(0,0); highlightMoon(null); render(); });
  $('#cockpit').addEventListener('click', event => {
    if (intro.locked) return;
    const index=pickMoon(event);
    const button=index===null?null:document.querySelector(`.project-picks [data-project="${index}"]`);
    if (button && !button.disabled) openMoon(index,button);
  });
  addEventListener('visibilitychange', () => { lastFrame = 0; if (!document.hidden) render(); });
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault(); lost = true; cancelAnimationFrame(frame); frame = 0;
    highlightMoon(null);
    operation?.resolve(true); operation = null; rejectFirstFrame(new Error('Viewing window context lost')); sceneFailure();
  });
  resize();
  await firstFrame;
  return { resize, render, beginIntro, endIntro, highlightMoon, setProgress(value, immediate = false) { targetTravel = scrollToTravel(value); if (immediate) travel = targetTravel; if(value!==1) { focusedMoon=null; highlightMoon(null); } render(); }, setMoon };
}
// A stalled optional module must leave the normal text view available.
const sceneDeadline = setTimeout(sceneFailure, 10000);
createScene().then(result => {
  clearTimeout(sceneDeadline);
  scene = result; sceneFailed = false;
  if ($('#scene-status').contains(document.activeElement)) $('#briefing-title').focus({ preventScroll:true });
  $('#scene-status').hidden = true; $('#window-mode').textContent = '3D ONLINE';
  intro.setScene(scene);
  settleBridge('scene'); updateRoute();
}).catch(error => {
  clearTimeout(sceneDeadline);
  if (!String(error).includes('fallback preview')) console.error(error);
  sceneFailure();
});
const initialStop = !recoveringScene && performance.getEntriesByType('navigation')[0]?.type === 'reload'
  ? 0 : slugs.indexOf(location.hash.slice(1));
history.scrollRestoration = 'manual';
requestAnimationFrame(() => goToStop(Math.max(0, initialStop), false, true));
addEventListener('hashchange', () => {
  const index = slugs.indexOf(location.hash.slice(1));
  if (index >= 0 && !detail.open) goToStop(index, false, true);
});
