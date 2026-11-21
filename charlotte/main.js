import { mountBalloons } from './balloons.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

// Фото работ: сколько штук в каждой услуге (файлы img/<услуга>-N.webp). Фото демо-версии со стока Unsplash,
// источники в img/manifest.json. EXTRA добавляет в ленту услуги фото из общих работ (img/works-N.webp).
const COUNT = { wedding: 5, photozone: 4, boom: 2, vypiska: 3, birthday: 3, bouquet: 3, men: 3, surprise: 2, opening: 1, pool: 1 };
const EXTRA = { opening: [2] };
const ALT = { wedding: 'Оформление свадьбы шарами и цветами', photozone: 'Фотозона из шаров', boom: 'Взрыв шаров на свадьбе',
  vypiska: 'Шары на выписку из роддома', birthday: 'Шары с надписью на день рождения', bouquet: 'Букет из шаров',
  men: 'Композиция из шаров для мужчины', surprise: 'Игрушка в шаре, сюрприз из шаров', opening: 'Оформление открытия шарами', pool: 'Шары в бассейне',
  works: 'Оформление праздника шарами' };
const photos = (cat) => [...Array.from({ length: COUNT[cat] }, (_, i) => `img/${cat}-${i + 1}.webp`),
  ...(EXTRA[cat] || []).map((n) => `img/works-${n}.webp`)];

// 1. Чёрные и золотые шары, в стиле «Шарлотты»: чёрный глянцевый латекс, золотая фольга, шампань-перламутр.
// Порядок цветов = порядок мест: 0 большой в центре, 1 справа, 2 впереди слева, 3 дальний сверху, 4 нижний, 5 дальний справа, 6 маленький сверху
const BALLOONS = { exposure: 1.35,
  colors: [{ c: '#141111', m: 'latex' }, { c: '#f0c46a', m: 'foil' }, { c: '#f1dfbd', m: 'pearl' }, { c: '#e8b75a', m: 'foil' }, { c: '#181414', m: 'latex' }, { c: '#2a2420', m: 'foil' }, { c: '#f4cf80', m: 'foil' }],
  confetti: ['#e6c07a', '#f6e7c8', '#141111', '#b8893f'] };
// Эффект 01 «Появление по буквам»: заголовок режем на слова (маска) и буквы, буквы выезжают снизу по очереди.
// Каллиграфическое слово в <em> не режем: оно всплывает целиком последним. Экранные дикторы читают aria-label.
const h1 = document.querySelector('.hero h1');
if (h1 && !reduce) {
  h1.setAttribute('aria-label', h1.textContent.replace(/\s+/g, ' ').trim());
  let n = 0;
  const frag = document.createDocumentFragment();
  [...h1.childNodes].forEach((node) => {
    if (node.nodeType === 3) {
      node.textContent.split(' ').forEach((word, wi, arr) => {
        if (word) {
          const w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
          [...word].forEach((ch) => {
            const l = document.createElement('span'); l.className = 'l'; l.textContent = ch;
            l.style.animationDelay = (0.12 + n++ * 0.03).toFixed(2) + 's';
            w.appendChild(l);
          });
          frag.appendChild(w);
        }
        if (wi < arr.length - 1) frag.appendChild(document.createTextNode(' '));
      });
    } else {
      const em = node.cloneNode(true); em.classList.add('em-in'); em.setAttribute('aria-hidden', 'true');
      em.style.animationDelay = (0.12 + n * 0.03 + 0.05).toFixed(2) + 's';
      frag.appendChild(em);
    }
  });
  h1.replaceChildren(frag);
  h1.classList.add('split');
  h1.parentElement.classList.add('split-on');
}

const hero = document.querySelector('[data-hero]');
let balloonsApi;
try {
  balloonsApi = mountBalloons(document.querySelector('.hero-canvas'), {
    material: 'latex', ambient: 0.55, groundTint: 0x3a2a18, keyLight: 0xffe7c2, keyIntensity: 2.4, stringColor: 0x9c8058, risers: 7, risersMobile: 0, riserZone: [0.12, 1],
    ...BALLOONS,
    layoutDesktop: [[0.42, 0.35, 0, 1.35], [0.7, 0.05, -1.5, 1.15], [0.26, -0.18, 1.2, 0.95], [0.85, 0.5, -3, 1], [0.58, -0.45, -0.5, 1.05], [0.95, -0.25, -2.5, 0.9], [0.12, 0.62, -3.5, 0.8]],
    layoutMobile: [[-0.55, 0.68, -1, 0.8], [0.1, 0.62, 0.5, 0.9], [0.7, 0.72, -2, 0.75], [-0.2, 0.9, -3.5, 0.6], [0.95, 0.88, -3, 0.6]]
  });
} catch (e) { /* без WebGL остаётся тёмный фон с золотыми огнями */ }
hero.addEventListener('balloon-pop', () => hero.classList.add('popped'), { once: true });

// Наезжающие блоки. Лист выше экрана прилипает, когда показан его низ (top = экран − высота листа).
// Пока следующий лист наезжает, нижний темнеет и на компьютере чуть уменьшается; закрытый лист прячем.
const sheets = [...document.querySelectorAll('.sheet')];
if (!reduce && sheets.length > 1) {
  const wide = matchMedia('(min-width: 900px)');
  let stick = [], ticking = false;
  const measure = () => {
    stick = sheets.map((sh) => Math.min(0, innerHeight - sh.offsetHeight));
    sheets.forEach((sh, i) => sh.style.setProperty('--stick', stick[i] + 'px'));
    update();
  };
  const update = () => {
    ticking = false;
    for (let i = 0; i < sheets.length - 1; i++) {
      const top = sheets[i + 1].getBoundingClientRect().top;
      const p = Math.min(1, Math.max(0, (innerHeight - top) / innerHeight));
      const sh = sheets[i];
      sh.style.setProperty('--cover', (p * 0.6).toFixed(3));
      sh.style.transformOrigin = `50% ${(-stick[i] + innerHeight / 2).toFixed(0)}px`;
      sh.style.transform = wide.matches && p > 0 ? `scale(${(1 - p * 0.05).toFixed(4)})` : '';
      const covered = top <= -60;
      sh.classList.toggle('covered', covered);
      if (i === 0) balloonsApi?.setPaused(covered);
    }
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', measure);
  const ro = new ResizeObserver(measure); sheets.forEach((sh) => ro.observe(sh));
  measure();
}

// Подвал: большое название точно во всю ширину и плавно поднимается, когда до него долистали
const mark = document.querySelector('.footer-mark'), markText = mark?.querySelector('span');
if (mark) {
  const fit = () => {
    markText.style.fontSize = '100px';
    const avail = mark.clientWidth - Math.max(16, innerWidth * 0.03) * 2;
    markText.style.fontSize = (100 * avail / markText.scrollWidth).toFixed(2) + 'px';
  };
  document.fonts.ready.then(fit); addEventListener('resize', fit); fit();
  new IntersectionObserver(([en], ob) => { if (en.isIntersecting) { mark.classList.add('in'); ob.disconnect(); } }, { threshold: 0.3 }).observe(mark);
}

// Шапка темнеет при прокрутке
const nav = document.querySelector('.nav');
const onScroll = () => nav.classList.toggle('scrolled', scrollY > innerHeight * 0.6);
addEventListener('scroll', onScroll, { passive: true }); onScroll();

// Просмотр фото на весь экран
const lb = document.querySelector('.lightbox'), lbImg = lb.querySelector('img');
let lbList = [], lbI = 0, lastFocus;
function openLB(list, i) {
  lbList = list; lbI = i; lastFocus = document.activeElement;
  lbImg.src = list[i]; lb.hidden = false; lb.querySelector('.lb-close').focus();
  document.body.style.overflow = 'hidden';
}
function closeLB() { lb.hidden = true; document.body.style.overflow = ''; lastFocus?.focus(); }
function stepLB(d) { lbI = (lbI + d + lbList.length) % lbList.length; lbImg.src = lbList[lbI]; }
lb.querySelector('.lb-close').onclick = closeLB;
lb.querySelector('.lb-prev').onclick = () => stepLB(-1);
lb.querySelector('.lb-next').onclick = () => stepLB(1);
lb.addEventListener('click', (e) => { if (e.target === lb) closeLB(); });
addEventListener('keydown', (e) => {
  if (lb.hidden) return;
  if (e.key === 'Escape') closeLB(); else if (e.key === 'ArrowRight') stepLB(1); else if (e.key === 'ArrowLeft') stepLB(-1);
});
let sx = 0;
lb.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
lb.addEventListener('touchend', (e) => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) stepLB(dx < 0 ? 1 : -1); });

function thumb(src, alt, list, i, eager) {
  const b = document.createElement('button');
  b.type = 'button'; b.setAttribute('aria-label', 'Открыть фото: ' + alt);
  b.innerHTML = `<img src="${src}" alt="${alt}" ${eager ? '' : 'loading="lazy"'} decoding="async">`;
  b.addEventListener('click', () => openLB(list, i));
  return b;
}

// 4. Услуги: строки раскрываются, внутри лента настоящих фото
const preview = document.querySelector('.hover-preview'), previewImg = preview.querySelector('img');
let previewTimer = 0, previewRow = null, startFollow = () => {};
document.querySelectorAll('.svc').forEach((svc, idx) => {
  const cat = svc.dataset.cat, list = photos(cat), strip = svc.querySelector('[data-strip]');
  list.forEach((src, i) => {
    const b = thumb(src, `${ALT[cat]}, фото ${i + 1}`, list, i, false);
    b.style.transitionDelay = (0.08 + i * 0.05) + 's';
    strip.appendChild(b);
  });
  const row = svc.querySelector('.svc-row');
  row.addEventListener('click', () => {
    const open = !svc.classList.contains('open');
    document.querySelectorAll('.svc.open').forEach((o) => { if (o !== svc) { o.classList.remove('open'); o.querySelector('.svc-row').setAttribute('aria-expanded', 'false'); } });
    svc.classList.toggle('open', open);
    row.setAttribute('aria-expanded', String(open));
    clearTimeout(previewTimer); preview.classList.remove('show');
  });
  if (fine && !reduce) {
    // фото появляется, только если мышка задержалась на пункте; при быстром проезде мимо ничего не выскакивает
    row.addEventListener('pointerenter', () => {
      if (svc.classList.contains('open')) return;
      clearTimeout(previewTimer);
      previewTimer = setTimeout(() => { previewImg.src = list[0]; previewRow = row; preview.classList.add('show'); startFollow(); }, 380);
    });
    row.addEventListener('pointerleave', () => { clearTimeout(previewTimer); preview.classList.remove('show'); });
  }
  if (idx === 0) { svc.classList.add('open'); row.setAttribute('aria-expanded', 'true'); }
});
if (fine && !reduce) {
  // фото выглядывает справа у кнопки «+» этого пункта, не закрывая название, и плавно переезжает между пунктами; когда скрыто, не считаем
  let px = 0, py = 0, tx = 0, ty = 0, running = false;
  const aim = () => {
    if (!previewRow) return;
    const r = previewRow.getBoundingClientRect(), plus = previewRow.querySelector('.svc-plus').getBoundingClientRect();
    tx = plus.left - preview.offsetWidth - 18; ty = r.top + r.height / 2;
  };
  addEventListener('scroll', () => { if (preview.classList.contains('show')) aim(); }, { passive: true });
  const follow = () => {
    px += (tx - px) * 0.12; py += (ty - py) * 0.12;
    preview.style.left = px + 'px'; preview.style.top = py + 'px';
    if (preview.classList.contains('show') || Math.abs(tx - px) > 0.5) requestAnimationFrame(follow); else running = false;
  };
  startFollow = () => { const first = !running; aim(); if (first) { running = true; px = tx; py = ty; requestAnimationFrame(follow); } };
}

// 5. Взрыв шаров: при появлении блока сверху сыплются шары
const boomList = photos('boom');
document.querySelector('[data-zoom="boom"]').addEventListener('click', () => openLB(boomList, 0));
const rain = document.querySelector('.boom-rain');
const RAIN = ['#e6c07a', '#141111', '#f1dfbd', '#d9ad5b', '#2a2420'];
if (!reduce) {
  new IntersectionObserver(([en], ob) => {
    if (!en.isIntersecting) return;
    ob.disconnect();
    const n = innerWidth < 720 ? 22 : 40;
    for (let i = 0; i < n; i++) {
      const b = document.createElement('i');
      b.style.cssText = `--x:${Math.random() * 100}%;--s:${(0.6 + Math.random() * 0.8).toFixed(2)};--delay:${(Math.random() * 1.4).toFixed(2)}s;--dur:${(2.4 + Math.random() * 1.6).toFixed(2)}s;--drift:${((Math.random() - 0.5) * 120).toFixed(0)}px;--rot:${((Math.random() - 0.5) * 50).toFixed(0)}deg;--c:${RAIN[i % RAIN.length]}`;
      rain.appendChild(b);
    }
  }, { threshold: 0.35 }).observe(document.querySelector('.boom'));
}

// Эффект 06 «Влёт в картинку»: пока секция прилипла, фото раскрывается из окошка на весь экран,
// слова «Взрыв» и «шаров» разъезжаются и гаснут, в конце появляется подпись. Без анимации — просто фото с подписью.
const fly = document.querySelector('.flyin');
if (fly) {
  if (reduce) fly.classList.add('static');
  else {
    const media = fly.querySelector('.flyin-media'), st = fly.style;
    const clamp = (v) => Math.min(1, Math.max(0, v));
    const seg = (p, a, b) => clamp((p - a) / (b - a));
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    let flyTick = false;
    const paint = () => {
      flyTick = false;
      const r = fly.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const p = clamp(-r.top / (r.height - innerHeight));
      const narrow = innerWidth < 720;
      const o = ease(seg(p, 0, 0.62)), k = 1 - o;
      st.setProperty('--iy', (k * (narrow ? 26 : 22)).toFixed(2) + '%');
      st.setProperty('--ix', (k * (narrow ? 12 : 33)).toFixed(2) + '%');
      st.setProperty('--r', (k * 28).toFixed(1) + 'px');
      st.setProperty('--sc', (1 + k * 0.25).toFixed(4));
      st.setProperty('--spread', (ease(seg(p, 0, 0.6)) * innerWidth * 0.42).toFixed(1) + 'px');
      st.setProperty('--wo', (1 - seg(p, 0.38, 0.62)).toFixed(3));
      st.setProperty('--dim', seg(p, 0.6, 0.85).toFixed(3));
      st.setProperty('--cap', ease(seg(p, 0.68, 0.92)).toFixed(3));
    };
    const onFly = () => { if (!flyTick) { flyTick = true; requestAnimationFrame(paint); } };
    addEventListener('scroll', onFly, { passive: true });
    addEventListener('resize', onFly);
    paint();
  }
}

// 6. Работы: две бесконечные ленты (вторая копия нужна для бесшовного круга)
const REELS = {
  a: [['wedding', 1], ['photozone', 1], ['bouquet', 1], ['vypiska', 1], ['works', 1], ['wedding', 3], ['photozone', 3], ['surprise', 1], ['men', 2], ['works', 2], ['birthday', 3], ['wedding', 5]],
  b: [['photozone', 2], ['wedding', 4], ['opening', 1], ['vypiska', 2], ['men', 1], ['works', 3], ['wedding', 2], ['photozone', 4], ['bouquet', 3], ['surprise', 2], ['birthday', 2], ['vypiska', 3]]
};
Object.entries(REELS).forEach(([key, items]) => {
  const track = document.querySelector(`[data-reel="${key}"] .reel-track`);
  const list = items.map(([c, n]) => `img/${c}-${n}.webp`);
  [0, 1].forEach((copy) => items.forEach(([c], i) => {
    const b = thumb(list[i], `${ALT[c]}, фото ${i + 1}`, list, i, false);
    if (copy) { b.tabIndex = -1; b.setAttribute('aria-hidden', 'true'); }
    track.appendChild(b);
  }));
});

// 2. Цифры считаются при появлении
const fmt = (v, space) => space ? Math.round(v).toLocaleString('ru-RU').replace(/ /g, ' ') : String(Math.round(v));
const countObs = new IntersectionObserver((ens) => ens.forEach((en) => {
  if (!en.isIntersecting) return;
  countObs.unobserve(en.target);
  const el = en.target, to = +el.dataset.count, space = el.dataset.format === 'space';
  if (reduce) return;
  const t0 = performance.now(), dur = 1400;
  (function tick(now) {
    const k = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - k, 3);
    el.textContent = fmt(to * e, space);
    if (k < 1) requestAnimationFrame(tick);
  })(t0);
}), { threshold: 0.6 });
document.querySelectorAll('[data-count]').forEach((el) => countObs.observe(el));

// Блоки мягко появляются при прокрутке
const revealObs = new IntersectionObserver((ens) => ens.forEach((en) => {
  if (!en.isIntersecting) return;
  en.target.classList.add('in');
  revealObs.unobserve(en.target);
}), { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('[data-reveal]').forEach((el, i) => {
  const sib = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
  el.style.transitionDelay = (sib.indexOf(el) * 0.08) + 's';
  revealObs.observe(el);
});

// Кнопки заказа: в рабочей версии откроют Telegram с готовым текстом
const toast = document.querySelector('.toast');
let toastTimer;
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-order]');
  if (!a) return;
  e.preventDefault();
  toast.textContent = `В рабочей версии откроется Telegram «Шарлотты» с текстом: «Здравствуйте, хочу заказать ${a.dataset.order}»`;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3800);
});
