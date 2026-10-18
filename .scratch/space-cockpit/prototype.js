// Three layouts of the same real portfolio. Read-only prototype, not production.
const $ = selector => document.querySelector(selector);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let calm = false;
const isReduced = () => reduced.matches || calm;
const stops = ['Opening', 'Selected work', 'Capabilities', 'About & experience', 'Contact'];
const slugs = ['opening', 'selected-work', 'capabilities', 'about-experience', 'contact'];
const variants = { A: 'Panoramic bridge', B: 'Command console', C: 'Navigation chart' };
const dialogues = [
  'Captain, navigation is ready. Our route will take us through the mission archives, operational capabilities, and command records.',
  'Captain, the mission archives are within range. Select a moon to inspect its challenges, decisions, and evidence.',
  'Captain, this sector charts the capabilities behind the missions. The console has the operational overview.',
  'Captain, these are my command records: the background, experience, and approach behind the work.',
  'Captain, our route is complete. Open a channel when you are ready to discuss your next mission.'
];
const captions = ['SELECTED WORK', 'SELECTED WORK', 'CAPABILITIES', 'ABOUT & EXPERIENCE', 'CONTACT'];
const opening = $('#briefing-content').innerHTML;
let variant = 'A', currentStop = -1, progress = 0, source, sourceError = false, projects = [], scene;
let lastTravel = 0, stopTimer, returnFocus, savedScroll = 0, approachTimer;
const detail = $('#project-detail');
$('#cockpit-interior').addEventListener('error', () => $('#cockpit').dataset.interior = 'fallback');
function updateMotionControl() {
  document.body.dataset.calm = String(isReduced());
  $('#motion-mode').setAttribute('aria-pressed', String(isReduced()));
  $('#motion-mode').disabled = reduced.matches;
  $('#motion-mode').title = reduced.matches ? 'Minimal motion follows your system preference.' : 'Toggle minimal motion';
  $('#motion-setting').textContent = isReduced() ? 'Minimal' : 'Standard';
}
$('#motion-mode').addEventListener('click', () => { calm = !calm; updateMotionControl(); });
reduced.addEventListener('change', updateMotionControl);
updateMotionControl();
const stateText = () => `Direction ${variant}: ${variants[variant]}. Destination: ${stops[currentStop]}.`;

function setVariant(next) {
  if (!variants[next]) return;
  variant = next;
  document.body.dataset.variant = next;
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
document.addEventListener('keydown', event => {
  if (detail.open || event.target.closest('input,textarea,select,[contenteditable],nav')) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    cycleVariant(event.key === 'ArrowLeft' ? -1 : 1);
  }
});

function goToStop(index, focus = true, immediate = false) {
  const max = document.documentElement.scrollHeight - innerHeight;
  scrollTo({ top: (index === 0 ? 0 : (index + .12) / 5) * max, behavior: isReduced() || immediate ? 'instant' : 'smooth' });
  history.replaceState(null, '', `${location.pathname}${location.search}#${slugs[index]}`);
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
  if (step) goToStop(Math.max(0, Math.min(4, currentStop + Number(step.dataset.routeStep))));
  if (event.target.closest('[data-retry-source]')) { sourceError = false; loadSource().catch(sourceFailure); }
});

const picks = () => `<div class="project-picks">${projects.map((project, i) => `<button type="button" data-project="${i}"><span class="moon-dot" aria-hidden="true"></span><span>${project.name}</span></button>`).join('')}</div>`;
function renderStop(index, announce = true) {
  currentStop = index;
  const views = [opening,
    `<p class="eyebrow">PLANET 01 / SELECTED WORK</p><h1 id="briefing-title" tabindex="-1">Proof,<br><em>in orbit.</em></h1><p class="body-copy">Four projects. Select a moon to inspect the work and its implementation evidence.</p>${projects.length ? picks() : sourceError ? '<p class="source-note" role="status">Project archives could not load. <a href="../../index.html">Read the existing portfolio →</a></p><button type="button" class="button" data-retry-source>Retry archives</button>' : '<p class="source-note">Loading project archives…</p>'}<p class="source-note">Optional moon visits. Your place in the journey is saved.</p>`,
    `<p class="eyebrow">PLANET 02 / CAPABILITIES</p><h1 id="briefing-title" tabindex="-1">From interface<br><em>to application.</em></h1><p class="body-copy">The skills used in the projects, organized by the work they support.</p><div class="capability-list"><div class="capability-row"><h2>Web interfaces</h2><p>React, TypeScript, JavaScript, HTML / CSS, Tailwind CSS</p></div><div class="capability-row"><h2>APIs &amp; application data</h2><p>Node.js, Express, Supabase, PostgreSQL, MySQL</p></div><div class="capability-row"><h2>Connected systems &amp; delivery</h2><p>REST APIs, MQTT, Docker, Git</p></div></div>`,
    `<p class="eyebrow">PLANET 03 / ABOUT &amp; EXPERIENCE</p><h1 id="briefing-title" tabindex="-1">The person<br><em>at the controls.</em></h1><p class="body-copy">Muhammad Iman Nugraha. Jakarta-based Informatics graduate, UPN Veteran Jakarta, 2022–2026.</p><div class="experience-summary"><h2>Front-End Intern · Mantra</h2><p>Mar–Oct 2025 · Responsive interfaces, frontend validation, and API integration within a Laravel application.</p></div><p class="source-note">AI-assisted workflow: review changes, test behavior, understand the code.</p>`,
    `<p class="eyebrow">FINAL DESTINATION / CONTACT</p><h1 id="briefing-title" tabindex="-1">A new mission<br><em>starts here.</em></h1><p class="body-copy">Tell me what you would like to build. Let’s discuss your project.</p><div class="briefing-actions"><a class="button button-primary" href="mailto:imannnnugraha@gmail.com">Discuss a Project <span aria-hidden="true">↗</span></a></div><a class="email-address" href="mailto:imannnnugraha@gmail.com">imannnnugraha@gmail.com</a><div class="contact-links"><a href="https://github.com/Jokskuyy" target="_blank" rel="noopener noreferrer">GitHub ↗</a><a href="https://www.linkedin.com/in/muhammad-nugraha-9bb016286/" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a><a href="../../output/pdf/muhammad-iman-nugraha-cv.pdf" download>CV ↓</a></div>`
  ];
  const titleFocused = document.activeElement?.id === 'briefing-title';
  $('#briefing-content').innerHTML = views[index];
  if (titleFocused) $('#briefing-title').focus({ preventScroll: true });
  $('#briefing').scrollTop = 0;
  $('#guide-dialogue').textContent = dialogues[index];
  $('#window-caption').innerHTML = `${captions[index]}<small>${index < 2 ? 'Mission archives · 4 project moons' : ['','','Operational overview','Background & approach','Open a channel'][index]}</small>`;
  document.querySelectorAll('[data-stop]').forEach(link => {
    if (Number(link.dataset.stop) === index) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  document.querySelectorAll('[data-route-step]').forEach(button => button.disabled = index + Number(button.dataset.routeStep) < 0 || index + Number(button.dataset.routeStep) > 4);
  if (announce) $('#destination-announcement').textContent = `Arrived at ${stops[index]}.`;
  $('#prototype-state').textContent = stateText();
  scene?.render();
}

function updateRoute() {
  if (detail.open || document.body.dataset.approaching) return;
  const max = document.documentElement.scrollHeight - innerHeight;
  progress = Math.min(4.999, (scrollY / Math.max(1, max)) * 5);
  const index = Math.floor(progress), fraction = progress - index;
  const t = Math.max(0, Math.min(1, (fraction - .58) / .42));
  lastTravel = Math.min(4, index + t * t * (3 - 2 * t));
  if (index !== currentStop) renderStop(index);
  const percent = Math.round(Math.min(1, progress / 4) * 100);
  $('#route-percent').innerHTML = `${percent}<span>%</span>`;
  $('#route-fill').style.width = `${percent}%`;
  document.querySelectorAll('.route-track b').forEach((dot, i) => dot.classList.toggle('reached', i <= index));
  $('#travel-status').textContent = t > 0 && index < 4 ? 'IN TRANSIT' : 'HOLDING POSITION';
  $('.officer').dataset.state = t > 0 && index < 4 ? 'traveling' : index === 0 ? 'idle' : 'arriving';
  clearTimeout(stopTimer);
  stopTimer = setTimeout(() => { if (!detail.open) $('.officer').dataset.state = currentStop === 0 ? 'idle' : 'explaining'; }, 650);
  scene?.setTravel(lastTravel);
}
addEventListener('scroll', updateRoute, { passive: true });

async function loadSource() {
  const sourceURL = new URL('../../index.html', location.href);
  const response = await fetch(sourceURL);
  if (!response.ok) throw new Error(`Portfolio source: ${response.status}`);
  source = new DOMParser().parseFromString(await response.text(), 'text/html');
  source.querySelectorAll('[href],[src]').forEach(node => {
    for (const attribute of ['href', 'src']) if (node.hasAttribute(attribute)) node.setAttribute(attribute, new URL(node.getAttribute(attribute), sourceURL).href);
  });
  projects = [...source.querySelectorAll('[data-build]')].map(node => ({ name: node.querySelector('.project-title').textContent.trim(), node }));
  $('#moon-labels').innerHTML = projects.map((project, i) => `<button class="moon-label" data-project="${i}" hidden>${project.name}</button>`).join('');
  renderStop(currentStop, false);
  scene?.render();
}
function openMoon(index, origin) {
  if (!projects[index] || detail.open || document.body.dataset.approaching) return;
  returnFocus = origin;
  savedScroll = scrollY;
  document.body.style.overflow = 'hidden';
  document.body.dataset.approaching = 'true';
  $('.officer').dataset.state = 'traveling';
  $('#travel-status').textContent = 'APPROACHING MOON';
  scene?.setMoon(index);
  approachTimer = setTimeout(() => {
    const project = projects[index];
    $('#detail-heading').textContent = project.name;
    const article = project.node.cloneNode(true);
    article.hidden = false;
    article.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    article.removeAttribute('id');
    article.querySelectorAll('details').forEach(node => node.open = true);
    $('#detail-content').replaceChildren(article);
    detail.showModal();
    detail.scrollTop = 0;
    $('#return-to-planet').focus();
    $('.officer').dataset.state = 'explaining';
    $('#travel-status').textContent = 'READING PROJECT';
    delete document.body.dataset.approaching;
  }, isReduced() ? 0 : 500);
}
$('#return-to-planet').addEventListener('click', () => detail.close());
detail.addEventListener('close', () => {
  clearTimeout(approachTimer);
  document.body.style.overflow = '';
  scrollTo({ top: savedScroll, behavior: 'instant' });
  scene?.setMoon(null);
  returnFocus?.focus({ preventScroll: true });
  updateRoute();
});

// The content and controls initialize before the optional 3D module.
renderStop(0, false);
setVariant(new URLSearchParams(location.search).get('variant') || 'A');
function sourceFailure(error) { console.error(error); sourceError = true; renderStop(currentStop, false); }
loadSource().catch(sourceFailure);
$('#retry-scene').addEventListener('click', () => {
  const url = new URL(location.href); url.searchParams.delete('scene'); location.href = url;
});
function sceneFailure() {
  $('#scene-status').hidden = false;
  $('#scene-status span').textContent = '3D is unavailable. You can still explore the content.';
  $('#retry-scene').hidden = false;
  $('#moon-labels').hidden = true;
  $('#window-mode').textContent = 'TEXT VIEW';
}

async function createScene() {
  if (new URLSearchParams(location.search).get('scene') === 'off') throw new Error('3D disabled for fallback preview');
  const THREE = await import('./node_modules/three/build/three.module.js');
  const host = $('#space');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0x050b17, 0);
  host.append(renderer.domElement);
  renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); sceneFailure(); });
  const world = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(43, 1, .1, 160);
  world.add(new THREE.AmbientLight(0x8cacc6, 1.35));
  const key = new THREE.DirectionalLight(0xffead1, 3.3); key.position.set(-8, 7, 12); world.add(key);
  const fill = new THREE.DirectionalLight(0x4c7d98, .7); fill.position.set(8, -2, -12); world.add(fill);
  // Fixed-seed stars: no idle travel, no allocation or draw loop while stopped.
  let seed = 54;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const starGeometry = new THREE.BufferGeometry(), starPositions = [];
  for (let i = 0; i < 1100; i++) starPositions.push((random() - .5) * 180, (random() - .5) * 120, -random() * 160);
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  world.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xc7dadb, size: .075, transparent: true, opacity: .7, sizeAttenuation: true })));
  const planetGeometry = new THREE.SphereGeometry(2.15, 56, 36), moonGeometry = new THREE.IcosahedronGeometry(.28, 2);
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
  const systems = [], moons = [];
  palettes.forEach((palette, i) => {
    const system = new THREE.Group(); system.position.set(2.5, .4, -(i + 1) * 18); world.add(system); systems.push(system);
    const planet = new THREE.Mesh(planetGeometry, new THREE.MeshStandardMaterial({ map: surface(palette, i), roughness: .94 }));
    planet.rotation.set(.12, .6 + i, -.16); system.add(planet);
    const atmosphere = new THREE.Mesh(planetGeometry, new THREE.ShaderMaterial({
      uniforms: { tint: { value: new THREE.Color(palette[2]) } },
      vertexShader: 'varying vec3 n; varying vec3 v; void main(){ vec4 p=modelViewMatrix*vec4(position,1.0); n=normalize(normalMatrix*normal); v=normalize(-p.xyz); gl_Position=projectionMatrix*p; }',
      fragmentShader: 'uniform vec3 tint; varying vec3 n; varying vec3 v; void main(){ float a=pow(1.0-abs(dot(normalize(n),normalize(v))),3.5)*0.32; gl_FragColor=vec4(tint,a); }',
      transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending
    })); atmosphere.scale.setScalar(1.055); system.add(atmosphere);
    if (i === 0 || i === 3) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(2.7, 3.7, 96), new THREE.MeshBasicMaterial({ color: i === 0 ? 0xa6bda2 : 0xb3a286, transparent: true, opacity: .25, side: THREE.DoubleSide, depthWrite: false }));
      ring.rotation.set(1.05, .18, -.32); system.add(ring);
    }
    if (i === 0) {
      [[-3.1,1.6,1.1],[2.7,1.7,-.7],[-2.5,-1.9,1.8],[2.9,-1.3,1.3]].forEach((position,j) => {
        const moon = new THREE.Mesh(moonGeometry, new THREE.MeshStandardMaterial({ color: [0xabb4a0,0x8c9eac,0xbbaa86,0x9b9eae][j], roughness: 1 })); moon.position.set(...position); system.add(moon); moons.push(moon);
      });
    }
  });
  let travel = lastTravel, selectedMoon = null;
  const projected = new THREE.Vector3(), cameraTarget = new THREE.Vector3();
  function render() {
    const centerX = variant === 'C' ? -.8 : variant === 'B' ? .4 : -1.35;
    // A fixed cockpit viewpoint. Outside systems pass laterally with depth;
    // the route never flies through a planet's surface.
    camera.position.set(centerX, 0, 14);
    systems.forEach((system, index) => {
      const distance = index + 1 - travel;
      system.position.set(2.5 + distance * 20, .4, -Math.abs(distance) * 24);
      system.visible = Math.abs(distance) < .85;
      if (index === 0 && travel < 1) {
        system.position.set(2.5, .4, -18 * (1 - travel));
        system.visible = true;
      }
    });
    cameraTarget.set(centerX, 0, camera.position.z - 15);
    if (selectedMoon !== null) {
      const moon = moons[selectedMoon]; moon.getWorldPosition(projected);
      camera.position.set(projected.x - 1.1, projected.y + .35, projected.z + 5);
      cameraTarget.copy(projected);
    }
    camera.lookAt(cameraTarget);
    renderer.render(world, camera);
    document.querySelectorAll('.moon-label').forEach((button, index) => {
      const visible = currentStop === 1 && !detail.open && selectedMoon === null && travel < 1.6;
      button.hidden = !visible;
      if (visible) {
        moons[index].getWorldPosition(projected); projected.project(camera);
        const bounds = host.getBoundingClientRect();
        button.style.left = `${bounds.left + (projected.x + 1) / 2 * bounds.width}px`;
        button.style.top = `${bounds.top + (-projected.y + 1) / 2 * bounds.height + 28}px`;
      }
    });
  }
  function resize() {
    const { width, height } = host.getBoundingClientRect();
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); render();
  }
  addEventListener('resize', resize);
  reduced.addEventListener('change', render);
  resize();
  $('#scene-status').hidden = true;
  $('#window-mode').textContent = '3D ONLINE';
  return { resize, render, setTravel(value) { travel = value; render(); }, setMoon(value) { selectedMoon = value; render(); } };
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
