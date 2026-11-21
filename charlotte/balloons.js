// 3D-шары кодом: плавают, отталкиваются от курсора или пальца, лопаются по нажатию с конфетти.
// Настройки приходят из темы: цвета, материал (pearl / latex / foil), где стоят шары.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function mountBalloons(canvas, cfg) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    canvas.closest('[data-hero]')?.classList.add('no-webgl');
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = cfg.exposure ?? 1.0;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 14);

  const key = new THREE.DirectionalLight(cfg.keyLight ?? 0xffffff, cfg.keyIntensity ?? 1.6);
  key.position.set(4, 6, 8);
  scene.add(key);
  scene.add(new THREE.HemisphereLight(0xffffff, cfg.groundTint ?? 0xf3e6e6, cfg.ambient ?? 0.6));

  // Форма шара: сфера, вытянутая вверх и сужающаяся книзу, как настоящий латекс.
  const geo = new THREE.SphereGeometry(1, 64, 48);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    // плавное сужение книзу без излома посередине
    const t = (1 - y) / 2;
    const k = 1 - 0.24 * t * t;
    p.setXYZ(i, x * k, y * 1.17, z * k);
  }
  geo.computeVertexNormals();
  const knotGeo = new THREE.ConeGeometry(0.13, 0.22, 16);

  function makeMaterial(entry) {
    // цвет строкой или { c: цвет, m: материал } для шаров разного материала вперемешку
    const color = typeof entry === 'string' ? entry : entry.c;
    const kind = (typeof entry === 'object' && entry.m) || cfg.material;
    const c = new THREE.Color(color);
    if (kind === 'foil') {
      return new THREE.MeshPhysicalMaterial({ color: c, metalness: 0.6, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.8 });
    }
    if (kind === 'pearl') {
      return new THREE.MeshPhysicalMaterial({ color: c, metalness: 0.15, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08,
        iridescence: 1, iridescenceIOR: 1.35, iridescenceThicknessRange: [180, 520], sheen: 0.6, sheenColor: new THREE.Color(0xffffff), envMapIntensity: 1.1 });
    }
    return new THREE.MeshPhysicalMaterial({ color: c, metalness: 0, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 0.9 });
  }

  const stringMat = new THREE.LineBasicMaterial({ color: cfg.stringColor ?? 0xbfb3b3, transparent: true, opacity: 0.7 });
  const balloons = [];
  const group = new THREE.Group();
  scene.add(group);

  function spawn(i, fromBelow) {
    const color = cfg.colors[i % cfg.colors.length];
    const mat = makeMaterial(color);
    const b = new THREE.Group();
    const body = new THREE.Mesh(geo, mat);
    const knot = new THREE.Mesh(knotGeo, mat);
    knot.position.y = -1.22;
    knot.rotation.x = Math.PI;
    const pts = [];
    for (let s = 0; s <= 12; s++) pts.push(new THREE.Vector3(Math.sin(s * 0.7) * 0.06, -1.3 - s * 0.32, 0));
    const string = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), stringMat);
    b.add(body, knot, string);
    const slot = layout[i];
    const scale = slot.s;
    b.scale.setScalar(scale);
    b.userData = { home: new THREE.Vector3(slot.x, slot.y, slot.z), vel: new THREE.Vector3(), phase: Math.random() * 6.28,
      speed: 0.5 + Math.random() * 0.4, scale, popping: 0, index: i, body };
    b.position.copy(b.userData.home);
    if (fromBelow) b.position.y -= 9;
    group.add(b);
    balloons[i] = b;
  }

  let layout = [];
  function computeLayout() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const aspect = w / Math.max(h, 1);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const halfW = halfH * aspect;
    const mobile = w < 720;
    const slots = (mobile ? cfg.layoutMobile : cfg.layoutDesktop) || cfg.layoutDesktop;
    // Узкий компьютер или планшет: шары меньше и плотнее к правому краю, чтобы не наезжать на заголовок
    const k = mobile ? 1 : Math.min(1, Math.max(0.6, aspect / 1.75));
    layout = slots.map(([fx, fy, z, s]) => ({ x: (fx < 0 ? fx : 1 - (1 - fx) * k) * halfW, y: fy * halfH, z, s: s * (mobile ? 0.66 : k) }));
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    computeLayout();
    balloons.forEach((b, i) => {
      if (!b || !layout[i]) return;
      b.userData.home.set(layout[i].x, layout[i].y, layout[i].z);
      b.userData.scale = layout[i].s;
      if (!b.userData.popping) b.scale.setScalar(layout[i].s);
    });
  }

  computeLayout();
  const count = (canvas.clientWidth < 720 ? cfg.layoutMobile : cfg.layoutDesktop).length;
  for (let i = 0; i < count; i++) spawn(i, false);
  resize();
  new ResizeObserver(resize).observe(canvas);

  // Маленькие шары вдалеке улетают в небо (если тема просит: cfg.risers = сколько)
  const risers = [];
  function riserSpan(z) {
    const dist = camera.position.z - z;
    const hh = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist;
    return { hh, hw: hh * camera.aspect };
  }
  function placeRiser(r, anywhere) {
    const { hh, hw } = riserSpan(r.position.z);
    // на компьютере шарики летят только за связкой, чтобы не мешать тексту
    const [z0, z1] = canvas.clientWidth >= 720 && cfg.riserZone ? cfg.riserZone : [-0.95, 0.95];
    r.position.x = (z0 + Math.random() * (z1 - z0)) * hw;
    r.position.y = anywhere ? (Math.random() * 2 - 1) * hh : -hh - 3;
    r.userData.speed = 0.5 + Math.random() * 0.6;
  }
  const riserCount = canvas.clientWidth < 720 ? (cfg.risersMobile ?? Math.ceil((cfg.risers || 0) / 2)) : (cfg.risers || 0);
  for (let i = 0; i < riserCount; i++) {
    const r = new THREE.Group();
    const mat = makeMaterial(cfg.colors[(i * 3 + 1) % cfg.colors.length]);
    r.userData.ci = i * 3 + 1;
    const body = new THREE.Mesh(geo, mat);
    const knot = new THREE.Mesh(knotGeo, mat);
    knot.position.y = -1.22; knot.rotation.x = Math.PI;
    const pts = [];
    for (let s = 0; s <= 8; s++) pts.push(new THREE.Vector3(Math.sin(s * 0.8) * 0.08, -1.3 - s * 0.35, 0));
    r.add(body, knot, new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), stringMat));
    r.scale.setScalar(0.28 + Math.random() * 0.22);
    r.position.z = -10 - Math.random() * 12;
    r.userData.phase = Math.random() * 6.28;
    placeRiser(r, true);
    scene.add(r);
    risers.push(r);
  }

  // Курсор и нажатия
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2(9, 9);
  const pointerWorld = new THREE.Vector3(999, 999, 0);
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  function setPointer(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    ray.ray.intersectPlane(plane, pointerWorld);
  }
  const hero = canvas.closest('[data-hero]') || canvas;
  hero.addEventListener('pointermove', setPointer);
  hero.addEventListener('pointerleave', () => pointerWorld.set(999, 999, 0));
  hero.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a,button')) return;
    setPointer(e);
    const hits = ray.intersectObjects(balloons.filter(Boolean).map((b) => b.userData.body), false);
    if (hits.length) {
      const b = hits[0].object.parent;
      if (!b.userData.popping) { b.userData.popping = 0.001; burst(b.position.clone(), b.userData.body.material.color); }
    }
  });

  // Конфетти
  const confetti = [];
  const confGeo = new THREE.PlaneGeometry(0.16, 0.08);
  function burst(at, baseColor) {
    const palette = [baseColor, ...cfg.confetti.map((c) => new THREE.Color(c))];
    for (let i = 0; i < 46; i++) {
      const m = new THREE.Mesh(confGeo, new THREE.MeshStandardMaterial({ color: palette[i % palette.length], side: THREE.DoubleSide,
        metalness: cfg.material === 'foil' ? 0.9 : 0.1, roughness: 0.4 }));
      m.position.copy(at);
      const a = Math.random() * Math.PI * 2, sp = 3 + Math.random() * 5;
      m.userData = { v: new THREE.Vector3(Math.cos(a) * sp, Math.sin(a) * sp + 2.5, (Math.random() - 0.5) * 3),
        spin: new THREE.Vector3(Math.random() * 9, Math.random() * 9, Math.random() * 9), life: 2.6 };
      scene.add(m);
      confetti.push(m);
    }
    hero.dispatchEvent(new CustomEvent('balloon-pop'));
  }

  // Анимация
  let visible = true, paused = false, last = performance.now(), t = 0;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) { last = performance.now(); loop(); } }).observe(canvas);
  const tmp = new THREE.Vector3();

  function step(dt) {
    t += dt;
    balloons.forEach((b, i) => {
      if (!b) return;
      const u = b.userData;
      if (u.popping) {
        u.popping += dt;
        const k = u.popping / 0.12;
        b.scale.setScalar(u.scale * (1 + k * 0.35));
        if (u.popping > 0.12) {
          group.remove(b);
          balloons[i] = null;
          setTimeout(() => spawn(i, true), 1600);
        }
        return;
      }
      const target = tmp.copy(u.home);
      target.y += Math.sin(t * u.speed + u.phase) * 0.22;
      target.x += Math.cos(t * u.speed * 0.7 + u.phase) * 0.1;
      // отталкивание от курсора
      const dx = b.position.x - pointerWorld.x, dy = b.position.y - pointerWorld.y;
      const d2 = dx * dx + dy * dy;
      const R = 2.6 * u.scale;
      if (d2 < R * R) {
        const d = Math.sqrt(d2) || 0.001, f = (1 - d / R) * 6;
        u.vel.x += (dx / d) * f * dt; u.vel.y += (dy / d) * f * dt;
      }
      u.vel.x += (target.x - b.position.x) * 2.2 * dt;
      u.vel.y += (target.y - b.position.y) * (b.position.y < target.y - 1 ? 0.9 : 2.2) * dt;
      u.vel.multiplyScalar(Math.pow(0.18, dt));
      b.position.x += u.vel.x * dt; b.position.y += u.vel.y * dt;
      b.position.z = u.home.z;
      b.rotation.z = -u.vel.x * 0.12 + Math.sin(t * 0.8 + u.phase) * 0.05;
      b.rotation.y = Math.sin(t * 0.4 + u.phase) * 0.35;
    });
    risers.forEach((r) => {
      const u = r.userData;
      r.position.y += u.speed * dt;
      r.position.x += Math.sin(t * 0.5 + u.phase) * 0.12 * dt;
      r.rotation.z = Math.sin(t * 0.7 + u.phase) * 0.12;
      if (r.position.y > riserSpan(r.position.z).hh + 3) placeRiser(r, false);
    });
    for (let i = confetti.length - 1; i >= 0; i--) {
      const c = confetti[i], u = c.userData;
      u.life -= dt;
      u.v.y -= 6 * dt; u.v.multiplyScalar(Math.pow(0.35, dt));
      c.position.addScaledVector(u.v, dt);
      c.rotation.x += u.spin.x * dt; c.rotation.y += u.spin.y * dt; c.rotation.z += u.spin.z * dt;
      if (u.life <= 0) { scene.remove(c); c.material.dispose(); confetti.splice(i, 1); }
    }
  }

  function loop() {
    if (!visible || paused) return;
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!reduce) step(dt);
    renderer.render(scene, camera);
    if (!reduce) requestAnimationFrame(loop);
  }
  loop();

  // Перекрасить шары на лету (для выбора палитры): новые материалы, старые освобождаем
  function paint(obj, entry) {
    const mat = makeMaterial(entry), old = obj.children[0].material;
    obj.children[0].material = mat; obj.children[1].material = mat;
    old.dispose();
  }
  return {
    // первый экран закрыт другим блоком: шары не считаем, чтобы не грузить телефон
    setPaused(p) { if (p === paused) return; paused = p; if (!p && visible) { last = performance.now(); loop(); } },
    recolor(next) {
      Object.assign(cfg, next);
      balloons.forEach((b) => b && paint(b, cfg.colors[b.userData.index % cfg.colors.length]));
      risers.forEach((r) => paint(r, cfg.colors[r.userData.ci % cfg.colors.length]));
      if (next.exposure) renderer.toneMappingExposure = next.exposure;
      if (reduce) renderer.render(scene, camera);
    }
  };
}
