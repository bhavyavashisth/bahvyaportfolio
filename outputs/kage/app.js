import * as THREE from './vendor/three.module.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const canvas = $('#world-canvas');
const status = $('#scene-status');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isSmallScreen = window.matchMedia('(max-width: 720px)').matches;
const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

const chapters = $$('.chapter[data-shot]');
const shots = [
  { p: [0, 5.1, 24], t: [0, 4.2, -15], f: 38 },
  { p: [0, 4.3, 12], t: [0, 3.2, -23], f: 42 },
  { p: [0, 5.2, -4], t: [0, 4.3, -35], f: 44 },
  { p: [0, 4.5, -22], t: [0, 4.7, -50], f: 42 },
  { p: [0, 5.2, -42], t: [0, 4.6, -68], f: 40 },
  { p: [0, 4.7, -58], t: [0, 3.9, -82], f: 42 }
];

const foregroundStates = [
  ['hills.webp', 'pines.webp', 'grass.webp', 'maple-branches.webp'],
  ['hills.webp', 'sakura.webp', 'stones.webp', 'lanterns.webp'],
  ['hills.webp', 'maple-branches.webp', 'stones.webp', 'bushes.webp'],
  ['pines.webp', 'ruins.webp', 'wall.webp', 'maple-branches.webp'],
  ['hills.webp', 'sakura.webp', 'grass.webp', 'lanterns.webp'],
  ['hills.webp', 'pines.webp', 'stones.webp', 'grass.webp']
];

function setForeground(index) {
  const foreground = $('#foreground');
  const layers = $$('.fg-layer', foreground);
  if (!layers.length) return;
  const sources = foregroundStates[index] || foregroundStates[0];
  if (layers.every((layer, i) => layer.getAttribute('src') === new URL(`assets/foreground/${sources[i]}`, import.meta.url).href)) return;
  foreground.classList.add('is-shifting');
  clearTimeout(setForeground.timer);
  setForeground.timer = window.setTimeout(() => {
    layers.forEach((layer, i) => {
      layer.src = new URL(`assets/foreground/${sources[i]}`, import.meta.url).href;
      layer.onerror = () => { layer.style.display = 'none'; };
      layer.onload = () => { layer.style.display = ''; };
    });
    requestAnimationFrame(() => foreground.classList.remove('is-shifting'));
  }, prefersReducedMotion ? 0 : 240);
}

function markActiveChapter(index) {
  if (!chapters.length) return;
  const active = Math.max(0, Math.min(chapters.length - 1, index));
  chapters[active].classList.add('is-visible');
  chapters[active].querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
  document.body.dataset.chapter = String(active + 1);
  $$('.chapter-rail__item').forEach((item, i) => {
    item.classList.toggle('is-active', i === active);
    if (i === active) item.setAttribute('aria-current', 'location');
    else item.removeAttribute('aria-current');
  });
  setForeground(active);
}

function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x172228);
  scene.fog = new THREE.FogExp2(0x172228, 0.0075);
  const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 180);
  camera.position.set(...shots[0].p);
  camera.lookAt(...shots[0].t);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isSmallScreen ? 1 : 1.5));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const hemi = new THREE.HemisphereLight(0x82939b, 0x171b19, 1.15);
  scene.add(hemi);
  const moonLight = new THREE.DirectionalLight(0x92b4d1, 1.25);
  moonLight.position.set(-12, 22, -20);
  scene.add(moonLight);
  const warmRim = new THREE.DirectionalLight(0xc78054, 0.72);
  warmRim.position.set(20, 10, -48);
  scene.add(warmRim);

  const mats = {
    ground: new THREE.MeshStandardMaterial({ color: 0x0c1718, roughness: 1 }),
    stone: new THREE.MeshStandardMaterial({ color: 0x343936, roughness: 0.94 }),
    stoneLit: new THREE.MeshStandardMaterial({ color: 0x4a4940, roughness: 0.92 }),
    bark: new THREE.MeshStandardMaterial({ color: 0x211e1a, roughness: 1 }),
    pine: new THREE.MeshStandardMaterial({ color: 0x172620, roughness: 1 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x26342a, roughness: 0.95, side: THREE.DoubleSide }),
    torii: new THREE.MeshStandardMaterial({ color: 0x8f382f, roughness: 0.72 }),
    toriiTop: new THREE.MeshStandardMaterial({ color: 0x4d2a25, roughness: 0.65 }),
    temple: new THREE.MeshStandardMaterial({ color: 0x242522, roughness: 0.9 }),
    roof: new THREE.MeshStandardMaterial({ color: 0x171c1c, roughness: 0.8 }),
    paper: new THREE.MeshStandardMaterial({ color: 0xd59e68, emissive: 0xb75c35, emissiveIntensity: 0.72, roughness: 0.85 }),
    moon: new THREE.MeshBasicMaterial({ color: 0xc6533e, toneMapped: false }),
    ember: new THREE.MeshBasicMaterial({ color: 0xe6a56b })
  };

  const groundGeo = new THREE.BufferGeometry();
  const width = 124, depth = 154, nx = isSmallScreen ? 62 : 110, nz = isSmallScreen ? 80 : 142;
  const pos = [], indices = [];
  for (let j = 0; j <= nz; j++) {
    const z = 32 - depth * (j / nz);
    for (let i = 0; i <= nx; i++) {
      const x = -width / 2 + width * (i / nx);
      const edge = Math.max(0, (Math.abs(x) - 29) / 30);
      const h = -0.05 + Math.sin(x * 0.13 + z * 0.026) * 0.18 + Math.cos(x * 0.21 - z * 0.041) * 0.09 + edge * edge * 2.4;
      pos.push(x, h, z);
      if (i < nx && j < nz) {
        const a = j * (nx + 1) + i, b = a + nx + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  groundGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  groundGeo.setIndex(indices);
  groundGeo.computeVertexNormals();
  const ground = new THREE.Mesh(groundGeo, mats.ground);
  ground.receiveShadow = false;
  scene.add(ground);

  function addMountain(points, color, z) {
    const shape = new THREE.Shape();
    shape.moveTo(points[0][0], points[0][1]);
    points.slice(1).forEach(([x, y]) => shape.lineTo(x, y));
    shape.lineTo(points.at(-1)[0], -1); shape.lineTo(points[0][0], -1); shape.closePath();
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
    mesh.position.z = z;
    scene.add(mesh);
  }
  addMountain([[-66,2],[-54,8],[-42,5],[-29,13],[-16,7],[-4,15],[10,6],[23,12],[39,5],[52,10],[66,2]], 0x1b2b31, -92);
  addMountain([[-67,1],[-55,6],[-44,4],[-31,9],[-18,5],[-3,11],[11,4],[26,9],[42,4],[56,8],[68,1]], 0x172429, -87);

  // A large iron-red moon and two soft, locally generated glow sprites.
  const moon = new THREE.Mesh(new THREE.SphereGeometry(5.9, 36, 28), mats.moon);
  const moonScale = isSmallScreen ? 0.75 : 1;
  moon.position.set(isSmallScreen ? 13.6 : 10.8, 13.7, -48);
  moon.scale.setScalar(moonScale);
  scene.add(moon);
  const moonGlow = createGlowTexture('#d95b40', 0.34);
  const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonGlow, color: 0xe1794f, transparent: true, opacity: 0.31, depthWrite: false, blending: THREE.AdditiveBlending }));
  glowSprite.position.copy(moon.position); glowSprite.scale.set(20 * moonScale, 20 * moonScale, 1); scene.add(glowSprite);
  const moonHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: createGlowTexture('#bb473c', 0.12), color: 0xc44c3c, transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending }));
  moonHalo.position.copy(moon.position); moonHalo.scale.set(37 * moonScale, 37 * moonScale, 1); scene.add(moonHalo);

  // A narrow approach path made from dark flagstone slabs.
  const pathGeo = new THREE.BoxGeometry(3.6, 0.11, 1.25);
  const pathCount = isSmallScreen ? 18 : 27;
  for (let i = 0; i < pathCount; i++) {
    const z = 22 - i * (154 / pathCount);
    const x = Math.sin(i * 0.58) * (i < 9 ? 1.3 : 0.42);
    const slab = new THREE.Mesh(pathGeo, i % 4 === 0 ? mats.stoneLit : mats.stone);
    slab.position.set(x, 0.06, z);
    slab.rotation.y = Math.sin(i * 4.7) * 0.06;
    scene.add(slab);
  }

  function addTorii(z, scale = 1, x = 0) {
    const group = new THREE.Group();
    const post = new THREE.BoxGeometry(0.5 * scale, 6.4 * scale, 0.58 * scale);
    for (const px of [-3.7, 3.7]) {
      const pillar = new THREE.Mesh(post, mats.torii); pillar.position.set(px * scale, 3.2 * scale, 0); group.add(pillar);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(.82 * scale, .34 * scale, .86 * scale), mats.toriiTop); foot.position.set(px * scale, .18 * scale, 0); group.add(foot);
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(10.4 * scale, .62 * scale, .92 * scale), mats.toriiTop);
    lintel.position.set(0, 6.4 * scale, 0); lintel.rotation.z = -.018; group.add(lintel);
    const lower = new THREE.Mesh(new THREE.BoxGeometry(8.1 * scale, .37 * scale, .55 * scale), mats.torii);
    lower.position.set(0, 5.35 * scale, .1 * scale); group.add(lower);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(11.5 * scale, .22 * scale, 1.12 * scale), mats.toriiTop);
    cap.position.set(0, 6.79 * scale, -.02 * scale); group.add(cap);
    group.position.set(x, 0, z);
    scene.add(group);
  }
  addTorii(-11, isSmallScreen ? .88 : 1.05, isSmallScreen ? 7 : 0);
  addTorii(-27, isSmallScreen ? .68 : .78, isSmallScreen ? 7.6 : 0.15);

  // Temple, layered roof, paper screens, and a gentle flight of stone steps.
  function addTemple() {
    const z = -47;
    const platform = new THREE.Mesh(new THREE.BoxGeometry(13.3, .55, 8.8), mats.stone);
    platform.position.set(0, .08, z); scene.add(platform);
    const body = new THREE.Mesh(new THREE.BoxGeometry(9.4, 4.1, 5.5), mats.temple);
    body.position.set(0, 2.34, z - .1); scene.add(body);
    const base = new THREE.Mesh(new THREE.BoxGeometry(10.5, .65, 6.25), mats.toriiTop);
    base.position.set(0, .67, z + .1); scene.add(base);
    const roofShape = new THREE.Shape();
    roofShape.moveTo(-6.9, 5.1); roofShape.lineTo(-5.6, 5.35); roofShape.lineTo(-4.5, 6.8); roofShape.lineTo(0, 7.35); roofShape.lineTo(4.5, 6.8); roofShape.lineTo(5.6, 5.35); roofShape.lineTo(6.9, 5.1); roofShape.lineTo(5.6, 7.18); roofShape.lineTo(0, 8.0); roofShape.lineTo(-5.6, 7.18); roofShape.closePath();
    const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(roofShape, { depth: 1.1, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: .08, bevelThickness: .08 }), mats.roof);
    roof.position.set(0, 0, z - 2.3); scene.add(roof);
    for (const x of [-4.5, 4.5]) {
      for (const frontZ of [z + 2.4, z - 2.3]) {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(.18, .24, 4.7, 8), mats.bark);
        col.position.set(x, 2.55, frontZ); scene.add(col);
      }
    }
    const door = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.25, .16), new THREE.MeshStandardMaterial({ color: 0x101717, roughness: .9 }));
    door.position.set(0, 2.42, z + 2.7); scene.add(door);
    for (const x of [-3.15, 3.15]) {
      const screen = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.85, .12), mats.paper);
      screen.position.set(x, 2.65, z + 2.75); scene.add(screen);
      const muntinMat = new THREE.MeshStandardMaterial({ color: 0x382c24, roughness: .8 });
      for (const dx of [-.48, 0, .48]) {
        const muntin = new THREE.Mesh(new THREE.BoxGeometry(.05, 2.83, .04), muntinMat);
        muntin.position.set(x + dx, 2.65, z + 2.85); scene.add(muntin);
      }
      const lamp = new THREE.PointLight(0xe6a45f, 1.3, 12, 2);
      lamp.position.set(x, 3.1, z + 3.4); scene.add(lamp);
    }
    for (let i = 0; i < 8; i++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(5.5 + i * .55, .22, 1.13), mats.stoneLit);
      step.position.set(0, .12 + i * .23, -36.3 - i * 1.42); scene.add(step);
    }
  }
  addTemple();

  function addLantern(x, z, scale = 1) {
    const group = new THREE.Group();
    const foot = new THREE.Mesh(new THREE.BoxGeometry(.82 * scale, .35 * scale, .82 * scale), mats.stoneLit); foot.position.y = .17 * scale; group.add(foot);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.09 * scale, .14 * scale, 1.18 * scale, 7), mats.stone); stem.position.y = .9 * scale; group.add(stem);
    const chamber = new THREE.Mesh(new THREE.BoxGeometry(.75 * scale, .72 * scale, .75 * scale), mats.paper); chamber.position.y = 1.72 * scale; group.add(chamber);
    const bars = new THREE.MeshStandardMaterial({ color: 0x332a23, roughness: .85 });
    for (const dx of [-.24, 0, .24]) { const b = new THREE.Mesh(new THREE.BoxGeometry(.035 * scale, .69 * scale, .04 * scale), bars); b.position.set(dx * scale, 1.72 * scale, .4 * scale); group.add(b); }
    const top = new THREE.Mesh(new THREE.CylinderGeometry(.65 * scale, .82 * scale, .18 * scale, 4), mats.toriiTop); top.position.y = 2.17 * scale; top.rotation.y = Math.PI / 4; group.add(top);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(.45 * scale, .4 * scale, 4), mats.toriiTop); cap.position.y = 2.43 * scale; cap.rotation.y = Math.PI / 4; group.add(cap);
    group.position.set(x, 0, z); scene.add(group);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: createGlowTexture('#f0b16d', .38), transparent: true, opacity: .52, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.position.set(x, 1.75 * scale, z + .1); glow.scale.set(3.4 * scale, 3.4 * scale, 1); scene.add(glow);
    const light = new THREE.PointLight(0xe4a35f, .72, 7 * scale, 2); light.position.set(x, 1.8 * scale, z); scene.add(light);
  }
  const lanternLocations = isSmallScreen
    ? [[-7,-23,.78],[7,-23,.78],[-5,-51,.78],[5,-51,.78]]
    : [[-6,-6,.9],[6,-6,.9],[-7,-23,.78],[7,-23,.78],[-7,-39,.82],[7,-39,.82],[-5,-51,.78],[5,-51,.78]];
  lanternLocations.forEach(p => addLantern(...p));

  function addTree(x, z, scale, type = 'pine') {
    const group = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.13 * scale, .27 * scale, 4.3 * scale, 7), mats.bark);
    trunk.position.y = 2.15 * scale; group.add(trunk);
    if (type === 'pine') {
      for (let i = 0; i < 5; i++) {
        const tier = new THREE.Mesh(new THREE.ConeGeometry((2.1 - i * .28) * scale, 2.35 * scale, 7), mats.pine);
        tier.position.y = (3.15 + i * .9) * scale; tier.rotation.y = i * .18; group.add(tier);
      }
    } else {
      const colors = [mats.leaf, new THREE.MeshStandardMaterial({ color: 0x344034, roughness: .96 }), new THREE.MeshStandardMaterial({ color: 0x46332d, roughness: .98 })];
      for (let i = 0; i < 7; i++) {
        const canopy = new THREE.Mesh(new THREE.IcosahedronGeometry((.95 + (i % 3) * .25) * scale, 1), colors[i % colors.length]);
        const a = i * Math.PI * 2 / 7;
        canopy.position.set(Math.cos(a) * 1.05 * scale, (4.6 + (i % 2) * .7) * scale, Math.sin(a) * .8 * scale);
        canopy.scale.set(1.25, .78, 1); group.add(canopy);
      }
    }
    group.position.set(x, 0, z); group.rotation.y = Math.sin(z * .4 + x) * .22; scene.add(group);
  }
  const treeLocations = [
    [-10,5,1.25,'pine'],[12,7,1.35,'maple'],[-13,-8,1.05,'maple'],[12,-13,1.3,'pine'],[-13,-20,1.2,'pine'],[13,-30,1.2,'maple'],[-12,-34,1.1,'maple'],[13,-45,1.35,'pine'],[-12,-50,1.15,'pine'],[12,-60,1.25,'maple'],[-15,-65,1.45,'pine'],[17,-75,1.5,'pine'],[-14,-82,1.3,'maple']
  ];
  (isSmallScreen ? treeLocations.filter((_, i) => i % 2 === 0) : treeLocations).forEach(args => addTree(...args));

  // A sparse bank of low, wind-shaped shrubs to hold the horizon together.
  for (let i = 0; i < (isSmallScreen ? 18 : 36); i++) {
    const side = i % 2 ? 1 : -1;
    const x = side * (8.5 + Math.random() * 14);
    const z = 17 - Math.random() * 101;
    const shrub = new THREE.Mesh(new THREE.IcosahedronGeometry(.55 + Math.random() * .8, 1), mats.leaf);
    shrub.position.set(x, .38, z); shrub.scale.set(1.8, .75, 1.05); scene.add(shrub);
  }

  const rain = createRain(scene, isSmallScreen ? 200 : 1050);
  const leaves = createLeaves(scene, isSmallScreen ? 10 : 34, mats);
  const embers = createEmbers(scene, isSmallScreen ? 10 : 38, mats.ember);
  const lookTarget = new THREE.Vector3(...shots[0].t);
  const desiredPosition = new THREE.Vector3(...shots[0].p);
  const desiredTarget = new THREE.Vector3(...shots[0].t);
  let desiredFov = shots[0].f;
  let pointerX = 0, pointerY = 0, smoothPointerX = 0, smoothPointerY = 0;
  let lastTime = 0, layoutDirty = true, lastChapter = -1;

  function shotAtScroll() {
    if (layoutDirty) {
      shotAtScroll.points = chapters.map(ch => ch.getBoundingClientRect().top + scrollY);
      layoutDirty = false;
    }
    const starts = shotAtScroll.points;
    if (!chapters.length) {
      desiredPosition.set(...shots[0].p);
      desiredTarget.set(...shots[0].t);
      desiredFov = shots[0].f;
      return;
    }
    let i = 0;
    while (i < starts.length - 1 && scrollY >= starts[i + 1]) i++;
    const t = i === starts.length - 1 ? 0 : THREE.MathUtils.clamp((scrollY - starts[i]) / Math.max(1, starts[i + 1] - starts[i]), 0, 1);
    const eased = t * t * (3 - 2 * t);
    const a = shots[i], b = shots[Math.min(i + 1, shots.length - 1)];
    desiredPosition.set(...a.p).lerp(new THREE.Vector3(...b.p), eased);
    desiredTarget.set(...a.t).lerp(new THREE.Vector3(...b.t), eased);
    desiredFov = THREE.MathUtils.lerp(a.f, b.f, eased);
    const center = scrollY + innerHeight * .47;
    let active = 0;
    for (let j = 0; j < chapters.length; j++) if (center >= starts[j]) active = j;
    if (active !== lastChapter) { lastChapter = active; markActiveChapter(active); }
    if (prefersReducedMotion) {
      const snap = Math.min(shots.length - 1, active);
      desiredPosition.set(...shots[snap].p); desiredTarget.set(...shots[snap].t); desiredFov = shots[snap].f;
    }
  }
  shotAtScroll();
  window.addEventListener('scroll', shotAtScroll, { passive: true });
  window.addEventListener('resize', () => { layoutDirty = true; camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isSmallScreen ? 1 : 1.5)); renderer.setSize(innerWidth, innerHeight, false); shotAtScroll(); }, { passive: true });
  if (!isTouch) window.addEventListener('pointermove', e => { pointerX = (e.clientX / innerWidth - .5) * 2; pointerY = (e.clientY / innerHeight - .5) * 2; }, { passive: true });

  function animate(now) {
    requestAnimationFrame(animate);
    if (document.hidden) return;
    const fpsCap = isSmallScreen ? 24 : 48;
    if (now - lastTime < 1000 / fpsCap) return;
    const dt = Math.min(.04, Math.max(.001, (now - lastTime) / 1000 || .016));
    lastTime = now;
    const amount = prefersReducedMotion ? 1 : 1 - Math.exp(-dt * 2.7);
    camera.position.lerp(desiredPosition, amount);
    lookTarget.lerp(desiredTarget, amount);
    smoothPointerX += (pointerX - smoothPointerX) * Math.min(1, dt * 1.3);
    smoothPointerY += (pointerY - smoothPointerY) * Math.min(1, dt * 1.3);
    if (!prefersReducedMotion && !isTouch) {
      camera.position.x += smoothPointerX * .16;
      camera.position.y -= smoothPointerY * .09;
      lookTarget.x += smoothPointerX * .2;
      lookTarget.y -= smoothPointerY * .1;
    }
    camera.lookAt(lookTarget);
    camera.fov += (desiredFov - camera.fov) * amount;
    camera.updateProjectionMatrix();
    if (!prefersReducedMotion) { updateRain(rain, dt); updateLeaves(leaves, dt); updateEmbers(embers, dt); }
    moon.rotation.y += prefersReducedMotion ? 0 : dt * .016;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);
  status.textContent = prefersReducedMotion ? '3D environment loaded. Motion is reduced.' : '3D environment loaded.';
  return { renderer, scene, camera };
}

function createGlowTexture(color, centerAlpha) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
  g.addColorStop(0, `${color}${Math.round(centerAlpha * 255).toString(16).padStart(2, '0')}`);
  g.addColorStop(.26, `${color}55`); g.addColorStop(.65, `${color}16`); g.addColorStop(1, `${color}00`);
  ctx.fillStyle = g; ctx.fillRect(0,0,128,128);
  return new THREE.CanvasTexture(canvas);
}

function createRain(scene, count) {
  const positions = new Float32Array(count * 6), velocities = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - .5) * 48, y = Math.random() * 24, z = 18 - Math.random() * 100;
    const n = i * 6; positions[n] = x; positions[n+1] = y; positions[n+2] = z; positions[n+3] = x - .045; positions[n+4] = y - .5; positions[n+5] = z;
    velocities[i] = 8 + Math.random() * 12;
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({ color: 0x91a6ad, transparent: true, opacity: .13, depthWrite: false });
  const rain = new THREE.LineSegments(geometry, material); scene.add(rain);
  return { mesh: rain, positions, velocities, count };
}
function updateRain(rain, dt) {
  for (let i = 0; i < rain.count; i++) {
    const n = i * 6; rain.positions[n+1] -= rain.velocities[i] * dt; rain.positions[n+4] -= rain.velocities[i] * dt;
    if (rain.positions[n+1] < .1) { const y = 14 + Math.random() * 10, x = (Math.random() - .5) * 48; rain.positions[n] = x; rain.positions[n+1] = y; rain.positions[n+3] = x - .045; rain.positions[n+4] = y - .5; }
  }
  rain.mesh.geometry.attributes.position.needsUpdate = true;
}
function createLeaves(scene, count, mats) {
  const shape = new THREE.Shape(); shape.moveTo(0,.17); shape.quadraticCurveTo(.17,.1,.12,0); shape.quadraticCurveTo(.08,-.14,0,-.2); shape.quadraticCurveTo(-.12,-.1,-.13,.02); shape.quadraticCurveTo(-.12,.15,0,.17);
  const geometry = new THREE.ShapeGeometry(shape, 4);
  const colors = [0x9a4c3c,0xb5684a,0xc07a50,0x7e513f];
  const leaves = [];
  for (let i = 0; i < count; i++) {
    const mat = new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: .8, side: THREE.DoubleSide, transparent: true, opacity: .82 });
    const mesh = new THREE.Mesh(geometry, mat); mesh.position.set((Math.random()-.5)*27, 2+Math.random()*10, -3-Math.random()*70); mesh.scale.setScalar(.45+Math.random()*.9); mesh.rotation.set(Math.random()*2,Math.random()*4,Math.random()*6); scene.add(mesh);
    leaves.push({ mesh, speed: .35+Math.random()*.75, drift: .25+Math.random()*.65, phase: Math.random()*6.28 });
  }
  return leaves;
}
function updateLeaves(leaves, dt) {
  for (const leaf of leaves) {
    leaf.phase += dt * leaf.drift;
    leaf.mesh.position.y -= leaf.speed * dt;
    leaf.mesh.position.x += Math.sin(leaf.phase) * dt * .6;
    leaf.mesh.rotation.z += dt * .55;
    if (leaf.mesh.position.y < .1) { leaf.mesh.position.y = 10 + Math.random()*7; leaf.mesh.position.z = -3-Math.random()*70; leaf.mesh.position.x = (Math.random()-.5)*27; }
  }
}
function createEmbers(scene, count, material) {
  const geometry = new THREE.SphereGeometry(.045, 5, 4), mesh = new THREE.InstancedMesh(geometry, material, count);
  const d = new THREE.Object3D(), points = [];
  for (let i = 0; i < count; i++) {
    const p = { x: (Math.random()-.5)*14, y: .25+Math.random()*4.3, z: -30-Math.random()*34, phase: Math.random()*6.28, speed: .25+Math.random()*.55, s: .4+Math.random()*1.1 };
    points.push(p); d.position.set(p.x,p.y,p.z); d.scale.setScalar(p.s); d.updateMatrix(); mesh.setMatrixAt(i,d.matrix);
  }
  scene.add(mesh); return { mesh, points };
}
function updateEmbers(embers, dt) {
  const d = new THREE.Object3D();
  embers.points.forEach((p,i) => { p.phase += dt*p.speed; p.y += dt*(.15+p.speed*.14); p.x += Math.sin(p.phase)*dt*.12; if (p.y>5.4) p.y=.2; d.position.set(p.x,p.y,p.z); d.scale.setScalar(p.s*(.75+Math.sin(p.phase)*.2)); d.updateMatrix(); embers.mesh.setMatrixAt(i,d.matrix); });
  embers.mesh.instanceMatrix.needsUpdate = true;
}

function setupEditorialMotion() {
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('is-visible'); });
  }, { threshold: .14 });
  chapters.forEach(chapter => sectionObserver.observe(chapter));
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
    });
  }, { threshold: .12, rootMargin: '0px 0px -5% 0px' });
  $$('.reveal').forEach(el => revealObserver.observe(el));
  if (prefersReducedMotion) { chapters.forEach(ch => ch.classList.add('is-visible')); $$('.reveal').forEach(el => el.classList.add('is-visible')); }
}

function setupNavigation() {
  const toggle = $('.menu-toggle');
  const nav = $('#primary-navigation');
  if (!toggle || !nav) return;
  function closeMenu() { toggle.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); document.body.classList.remove('menu-open'); }
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open)); nav.classList.toggle('is-open', open); document.body.classList.toggle('menu-open', open);
  });
  nav.addEventListener('click', e => { if (e.target.closest('a')) window.setTimeout(closeMenu, 60); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  $$('.chapter-rail__item').forEach(link => link.addEventListener('click', () => { if (prefersReducedMotion) return; const target = $(link.getAttribute('href')); target?.scrollIntoView({ behavior: 'smooth' }); }));
}

function setupCursor() {
  if (isTouch || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const cursor = $('#cursor');
  if (!cursor) return;
  let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
  window.addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; document.body.classList.add('cursor-ready'); }, { passive: true });
  const move = () => { x += (tx-x)*.26; y += (ty-y)*.26; cursor.style.left = `${x}px`; cursor.style.top = `${y}px`; requestAnimationFrame(move); };
  requestAnimationFrame(move);
  $$('a, button').forEach(el => { el.addEventListener('pointerenter', () => document.body.classList.add('cursor-hover')); el.addEventListener('pointerleave', () => document.body.classList.remove('cursor-hover')); });
}

setupEditorialMotion();
setupNavigation();
setupCursor();
setForeground(0);
try {
  if (!window.WebGLRenderingContext) throw new Error('WebGL unavailable');
  createScene();
} catch (error) {
  document.body.classList.add('no-webgl');
  if (canvas) canvas.hidden = true;
  if (status) status.textContent = 'The 3D environment could not be loaded. The page remains available.';
}
