/* Общая логика прототипа «Говоруша»: подбор по возрасту, подбор по проблеме, попугаи, появление блоков. */
(function () {
  const THEME = window.GOV_THEME || {};
  const TG = 'https://t.me/+79900285305';
  const TEL = 'tel:+79900285305';

  // ---------- данные (из Инстаграма центра, сентябрь–ноябрь 2026) ----------
  const AGES = [
    { l: '10 мес', v: 0.8 }, { l: '1 год', v: 1 }, { l: '2 года', v: 2 }, { l: '3 года', v: 3 },
    { l: '4 года', v: 4 }, { l: '5 лет', v: 5 }, { l: '6 лет', v: 6 }, { l: '7 лет', v: 7 },
    { l: '8 лет', v: 8 }, { l: '9 лет', v: 9 }, { l: '10 лет', v: 10 }, { l: '11–14', v: 12 }, { l: '15–17', v: 16 }
  ];
  const PROGRAMS = [
    { n: 'Мама + Малыш', t: 'Развитие', a: [1, 2.99], p: '700 ₽', w: 'вт и чт 11:00, сб 10:00', d: 'Мягкая адаптация, речь и моторика, пока мама рядом' },
    { n: 'Сенсорная интеграция', t: 'Коррекция', a: [0.8, 17], p: '1 500 ₽', w: 'по записи', d: 'Когда ребёнок слишком чувствительный или «не чувствует» тело' },
    { n: 'Адаптивная физкультура', t: 'Коррекция', a: [0.8, 17], p: '1 000 ₽', w: 'по записи', d: 'Осанка, стопы, координация, дети с ОВЗ' },
    { n: 'Запуск речи с дефектологом', t: 'Коррекция', a: [2, 5.99], p: '1 400 ₽', w: 'по записи', d: 'Для неговорящих детей и задержки речи' },
    { n: 'Логопед', t: 'Коррекция', a: [3, 17], p: '1 400 ₽', w: 'по записи', d: 'Звуки, словарь, связная речь' },
    { n: 'Логопедический массаж', t: 'Коррекция', a: [3, 17], p: '650 ₽ · курс 6 500 ₽', w: 'утро и вечер', d: 'Курс 10 сеансов, 2–3 раза в неделю' },
    { n: 'Нейропсихолог', t: 'Коррекция', a: [3, 17], p: '1 400 ₽', w: 'по записи', d: 'Внимание, память, усидчивость, саморегуляция' },
    { n: 'Детский психолог', t: 'Коррекция', a: [3, 17], p: 'уточнить', w: 'по записи', d: 'Страхи, стеснительность, капризы, адаптация' },
    { n: 'Мини-садик', t: 'Присмотр', a: [3, 5.99], p: '1 000 ₽ / день', w: 'пн–пт 9:00–13:00', d: 'До 10 детей, логопед и нейропсихолог внутри, можно не каждый день' },
    { n: 'Раннее развитие', t: 'Развитие', a: [3, 4.99], p: '650 ₽', w: 'группа', d: 'Логика, речь, моторика через игру' },
    { n: 'ИЗО-студия', t: 'Творчество', a: [3, 17], p: '650 ₽', w: 'группа', d: 'Ведёт профессиональный художник' },
    { n: 'Английский', t: 'Развитие', a: [3, 17], p: '700 ₽', w: 'группа', d: 'В игре для малышей, школьная программа для старших' },
    { n: 'Подготовка к школе', t: 'Школа', a: [5, 6.99], p: '700 ₽', w: 'группа', d: 'Чтение, счёт, рука к письму, без страха перед уроками' },
    { n: 'Логопедическая подготовка', t: 'Школа', a: [5, 6.99], p: '800 ₽', w: 'группа', d: 'Звуки и грамота перед первым классом' },
    { n: 'Группа первоклашек', t: 'Школа', a: [7, 7.99], p: '700 ₽', w: 'пн, ср, пт 13:00–15:00', d: 'Математика, русский, чтение, английский, ИЗО' },
    { n: 'Умная продлёнка', t: 'Присмотр', a: [7, 10.99], p: '500 ₽', w: 'пн, ср, пт 14:00–17:00', d: 'Домашнее задание с педагогом, игры, спорт' },
    { n: 'Репетиторы и математика', t: 'Школа', a: [8, 17], p: 'уточнить', w: 'по записи', d: 'Начальная школа, математика 5–11 класс' }
  ];
  const PROBLEMS = [
    { id: 'silent', l: 'Не говорит или мало слов', who: ['Логопед-дефектолог'],
      text: a => a < 2 ? 'До двух лет многое ещё впереди. Покажем, как разговорить малыша дома, и подберём занятия «Мама + Малыш» или сенсорную интеграцию.' : 'Запускаем речь с логопедом-дефектологом. Сначала диагностика: важно понять, почему ребёнок молчит, от этого зависит план.' },
    { id: 'sounds', l: 'Говорит непонятно, не выговаривает звуки', who: ['Логопед', 'Логомассаж'],
      text: a => a < 3.5 ? 'До 3–4 лет многие звуки ещё не появились, это нормально. Покажитесь логопеду, если малыша не понимают даже близкие.' : 'Логопед поставит звуки, а курс логомассажа ускорит работу, если мышцы языка «слабые» или зажатые.' },
    { id: 'stutter', l: 'Заикается', who: ['Логопед', 'Детский психолог'],
      text: () => 'Работают вместе логопед и психолог: речь и спокойствие. Иногда добавляем логомассаж.' },
    { id: 'focus', l: 'Не может усидеть, быстро отвлекается', who: ['Нейропсихолог'],
      text: () => 'Нейропсихолог развивает внимание, память и самоконтроль через игры и движение.' },
    { id: 'fears', l: 'Страхи, истерики, стеснительность', who: ['Детский психолог'],
      text: () => 'Психолог помогает ребёнку справляться с эмоциями, а родителям — понять, что за ними стоит.' },
    { id: 'school', l: 'Скоро в школу', who: ['Подготовка к школе', 'Нейропсихолог'],
      text: a => a >= 7 ? 'Уже первоклассник? Группа первоклашек и умная продлёнка возьмут уроки на себя.' : 'Группа подготовки научит читать и считать, а нейропсихолог проверит, готов ли ребёнок сидеть за партой.' },
    { id: 'special', l: 'ЗРР, РАС, ДЦП, другие особенности', who: ['Дефектолог', 'Сенсорная интеграция', 'ЛФК'],
      text: () => 'Индивидуальный маршрут: дефектолог, сенсорная интеграция и адаптивная физкультура по одному плану.' },
    { id: 'body', l: 'Неуклюжий, осанка, стопы', who: ['Адаптивная физкультура'],
      text: () => 'Укрепляем мышцы, работаем с осанкой, вальгусом стоп и координацией. Подходит и детям с ОВЗ.' },
    { id: 'potty', l: 'Трудности с горшком', who: ['Детский психолог'],
      text: () => 'Не ругаем и не заставляем. Ищем причину: неготовность, страх или особенности ощущений.' }
  ];

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ---------- попугаи ----------
  const heroP = $('#heroParrot') && mountParrot($('#heroParrot'), THEME.parrot);
  const pickP = $('#pickParrot') && mountParrot($('#pickParrot'), THEME.parrot);
  const buddyEl = $('#buddy');
  const buddy = buddyEl && mountParrot(buddyEl, THEME.parrot);

  let mouse = null;
  addEventListener('pointermove', e => { if (e.pointerType === 'mouse') mouse = { x: e.clientX, y: e.clientY }; });

  // герой: привет при загрузке
  if (heroP) {
    heroP.pose('wave');
    setTimeout(() => heroP.say(THEME.hello || 'Привет! Я Говоруша', 2600), 500);
    setTimeout(() => heroP.pose(''), 2200);
    heroP.el.addEventListener('click', () => {
      heroP.pose('happy'); heroP.say('Ура! Давай знакомиться', 1800);
      setTimeout(() => heroP.pose(''), 1800);
    });
  }

  // без мыши (телефон): попугай сам оглядывается
  let idleT = 0;
  function idleLook(p) {
    const r = p.el.getBoundingClientRect();
    const pts = [[-200, 40], [260, -120], [300, 160], [0, 260], [-260, -60]];
    const q = pts[(idleT++) % pts.length];
    p.lookAt(r.left + r.width / 2 + q[0], r.top + r.height / 3 + q[1]);
  }
  setInterval(() => {
    if (mouse) return;
    if (heroP) idleLook(heroP);
    if (buddy) idleLook(buddy);
  }, 1700);

  let sliderFollow = false;
  function frame() {
    if (mouse) {
      if (heroP) heroP.lookAt(mouse.x, mouse.y);
      if (buddy) buddy.lookAt(mouse.x, mouse.y);
      if (pickP && !sliderFollow) pickP.lookAt(mouse.x, mouse.y);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---------- подбор по возрасту ----------
  const range = $('#ageRange');
  const ageOut = $('#ageOut');
  const results = $('#ageResults');
  function thumbPoint() {
    const r = range.getBoundingClientRect();
    const k = (range.value - range.min) / (range.max - range.min);
    return { x: r.left + 14 + k * (r.width - 28), y: r.top + r.height / 2 };
  }
  function renderAge() {
    const a = AGES[range.value];
    ageOut.textContent = a.l;
    range.style.setProperty('--fill', (range.value / (AGES.length - 1) * 100) + '%');
    const list = PROGRAMS.filter(p => a.v >= p.a[0] && a.v <= p.a[1]);
    results.innerHTML = list.map((p, i) => `
      <article class="prog" style="--i:${i}">
        <span class="prog-tag">${p.t}</span>
        <h4>${p.n}</h4>
        <p>${p.d}</p>
        <div class="prog-meta"><b>${p.p}</b><span>${p.w}</span></div>
      </article>`).join('') +
      (a.v < 3 ? `<p class="note">До 3 лет занимаемся индивидуально или вместе с мамой.</p>` : '');
    if (pickP) {
      const n = list.length;
      pickP.say((n % 10 === 1 && n % 100 !== 11 ? 'Подходит ' : 'Подходят ') + n + ' ' + plural(n, 'занятие', 'занятия', 'занятий'), 2200);
    }
  }
  function plural(n, a, b, c) { const m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : (m >= 2 && m <= 4 && (h < 12 || h > 14) ? b : c); }
  if (range) {
    range.max = AGES.length - 1;
    range.addEventListener('input', () => {
      renderAge();
      if (pickP) { sliderFollow = true; const t = thumbPoint(); pickP.lookAt(t.x, t.y); pickP.pose('point'); }
    });
    const stop = () => { sliderFollow = false; if (pickP) setTimeout(() => pickP.pose(''), 600); };
    range.addEventListener('change', stop); range.addEventListener('pointerup', stop);
    renderAge();
  }

  // ---------- подбор по проблеме ----------
  const chips = $('#problemChips');
  const ageSel = $('#problemAge');
  const answer = $('#problemAnswer');
  let chosen = null;
  if (chips) {
    chips.innerHTML = PROBLEMS.map(p => `<button type="button" class="chip" data-id="${p.id}" aria-pressed="false">${p.l}</button>`).join('');
    ageSel.innerHTML = AGES.map((a, i) => `<option value="${i}" ${i === 5 ? 'selected' : ''}>${a.l}</option>`).join('');
    chips.addEventListener('click', e => {
      const b = e.target.closest('.chip'); if (!b) return;
      $$('.chip', chips).forEach(c => { c.classList.toggle('on', c === b); c.setAttribute('aria-pressed', c === b); });
      chosen = PROBLEMS.find(p => p.id === b.dataset.id);
      renderAnswer();
      if (pickP) { pickP.pose('think'); setTimeout(() => { pickP.pose('happy'); pickP.say('Знаю, кто поможет!', 1800); }, 700); setTimeout(() => pickP.pose(''), 2300); }
    });
    ageSel.addEventListener('change', renderAnswer);
  }
  function renderAnswer() {
    if (!chosen) return;
    const a = AGES[ageSel.value].v;
    answer.classList.remove('show'); void answer.offsetWidth;
    answer.innerHTML = `
      <div class="ans-who">${chosen.who.map(w => `<span>${w}</span>`).join('')}</div>
      <p>${chosen.text(a)}</p>
      <div class="ans-cta">
        <a class="btn btn-main" href="${TG}" target="_blank" rel="noopener">Записаться на диагностику · 1 600 ₽</a>
        <a class="btn btn-ghost" href="${TEL}">Позвонить</a>
      </div>`;
    answer.classList.add('show');
  }

  // вкладки подбора
  $$('.pick-tab').forEach(t => t.addEventListener('click', () => {
    $$('.pick-tab').forEach(x => { x.classList.toggle('on', x === t); x.setAttribute('aria-selected', x === t); });
    $$('.pick-pane').forEach(p => p.classList.toggle('on', p.id === t.dataset.pane));
    if (pickP) pickP.say(t.dataset.pane === 'paneAge' ? 'Двигай ползунок!' : 'Что беспокоит?', 1800);
  }));

  // ---------- афиша: праздники из Telegram-канала (на сайте — /afisha.php, в демо — пример) ----------
  const AFISHA_URL = window.GOV_AFISHA || 'afisha-demo.json';
  const MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  const WDAYS = ['вс','пн','вт','ср','чт','пт','сб'];
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  function untilText(d) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const n = Math.round((d - today) / 864e5);
    if (n === 0) return 'Сегодня';
    if (n === 1) return 'Завтра';
    if (n < 0) return '';
    return 'Через ' + n + ' ' + plural(n, 'день', 'дня', 'дней');
  }
  const afisha = $('#afisha');
  const afishaReady = !afisha ? Promise.resolve(false) : fetch(AFISHA_URL, { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(data => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const list = ((data && data.events) || [])
      .map(e => ({ ...e, d: new Date(e.date + 'T00:00:00') }))
      .filter(e => e.title && !isNaN(e.d) && e.d >= today)
      .sort((a, b) => a.d - b.d).slice(0, 6);
    if (!list.length) return false;
    $('#afishaGrid').innerHTML = list.map((e, i) => {
      const href = /^https:\/\/t\.me\//.test(e.link || '') ? e.link : TG;
      const img = typeof e.image === 'string' && /^\/(?!\/)/.test(e.image) ? e.image : null;
      const meta = [e.time && ('в ' + e.time), e.age, e.price && e.price !== 'уточняйте' && e.price].filter(Boolean);
      return `<article class="ev" style="--i:${i}">
        <div class="ev-poster${img ? ' has-img' : ''}">
          ${img ? `<img src="${esc(img)}" alt="${esc(e.title)}" loading="lazy">` : ''}
          <div class="ev-date"><b>${e.d.getDate()}</b><span>${MONTHS[e.d.getMonth()]}, ${WDAYS[e.d.getDay()]}</span></div>
          <span class="ev-until">${untilText(e.d)}</span>
        </div>
        <div class="ev-body">
          <h3>${esc(e.title)}</h3>
          ${e.text ? `<p>${esc(e.text)}</p>` : ''}
          ${meta.length ? `<ul class="ev-meta">${meta.map(m => `<li>${esc(m)}</li>`).join('')}</ul>` : ''}
          <a class="btn btn-main" href="${esc(href)}" target="_blank" rel="noopener">Записаться</a>
        </div>
      </article>`;
    }).join('');
    afisha.hidden = false;
    return true;
  }).catch(() => false);

  // ---------- спутник: поза и реплика на каждый блок ----------
  const lines = {
    pick: ['point', ''], why: ['think', 'Почему сначала диагностика?'], prices: ['read', 'Все цены здесь'],
    week: ['point', 'Выбирай удобный день'], afisha: ['party', 'Приходите на праздник!'], reviews: ['happy', 'Что пишут мамы'], faq: ['think', 'Спрашивайте!'], find: ['wave', 'Ждём в ТЦ «Европа»!']
  };
  if (buddy) {
    const io = new IntersectionObserver(es => {
      es.forEach(e => {
        if (!e.isIntersecting) return;
        const id = e.target.dataset.buddy;
        buddyEl.classList.toggle('hide', id === 'hero' || id === 'pick');
        const l = lines[id]; if (!l) return;
        buddy.pose(l[0]); if (l[1]) buddy.say(l[1], 2600);
      });
    }, { threshold: 0.45 });
    $$('[data-buddy]').forEach(s => io.observe(s));
    buddyEl.addEventListener('click', () => { buddy.pose('happy'); buddy.say('Записаться: +7 990 028-53-05', 3000); });
  }

  // ---------- появление блоков ----------
  const rv = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rv.unobserve(e.target); } }), { threshold: 0.15 });
  $$('.rv').forEach(el => rv.observe(el));
})();
