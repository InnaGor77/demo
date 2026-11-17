/* Попугай «Говоруша»: SVG, следит головой и глазами за точкой, умеет позы.
   mountParrot(el, {body, belly, wing, beak, face, ink}) -> api {lookAt(x,y), lookHome(), pose(name), say(text)} */
(function () {
  const svgNS = 'http://www.w3.org/2000/svg';

  function markup(c) {
    return `
<svg class="parrot-svg" viewBox="0 0 220 260" aria-hidden="true">
  <g class="pr-perch">
    <path d="M14 226 C 80 216, 150 218, 216 228" stroke="${c.perch}" stroke-width="11" fill="none" stroke-linecap="round"/>
    <path d="M178 222 C 188 208, 198 204, 208 206" stroke="${c.perch}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <ellipse cx="206" cy="202" rx="11" ry="5" fill="${c.leaf}" transform="rotate(-25 206 202)"/>
    <ellipse cx="30" cy="216" rx="12" ry="5" fill="${c.leaf}" transform="rotate(20 30 216)"/>
  </g>
  <g class="pr-all">
    <g class="pr-tail">
      <path d="M96 196 C 86 230, 92 252, 104 258 C 108 238, 112 222, 116 200 Z" fill="${c.wing}"/>
      <path d="M112 198 C 112 232, 122 250, 134 254 C 132 234, 130 218, 126 198 Z" fill="${c.beak}"/>
    </g>
    <g class="pr-body">
      <ellipse cx="112" cy="150" rx="52" ry="62" fill="${c.body}"/>
      <ellipse cx="118" cy="166" rx="32" ry="40" fill="${c.belly}"/>
      <path d="M100 150 q8 6 16 0 M106 172 q8 6 16 0 M112 194 q8 5 14 0" stroke="${c.body}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".45"/>
    </g>
    <g class="pr-wing-back"><path d="M150 128 C 176 150, 178 188, 158 206 C 150 182, 146 156, 150 128 Z" fill="${c.wing}" opacity=".9"/></g>
    <g class="pr-wing">
      <path d="M78 122 C 50 140, 46 186, 66 210 C 80 196, 92 160, 90 128 Z" fill="${c.wing}"/>
      <path d="M66 190 C 62 200, 64 206, 66 210 M72 176 C 66 188, 66 196, 68 204" stroke="${c.ink}" stroke-width="2" fill="none" opacity=".25" stroke-linecap="round"/>
      <g class="pr-book">
        <rect x="34" y="150" width="46" height="34" rx="4" fill="#fff" stroke="${c.ink}" stroke-width="2.5"/>
        <path d="M57 152 v30" stroke="${c.ink}" stroke-width="2"/>
        <path d="M40 160 h12 M40 167 h12 M62 160 h12 M62 167 h10" stroke="${c.ink}" stroke-width="1.6" opacity=".5"/>
      </g>
    </g>
    <g class="pr-feet" fill="${c.beak}">
      <path d="M96 206 l-6 14 h18 z"/><path d="M124 206 l-4 14 h18 z"/>
    </g>
    <g class="pr-head">
      <g class="pr-crest">
        <path d="M104 40 C 96 14, 110 4, 118 10 C 112 20, 114 30, 118 40 Z" fill="${c.wing}"/>
        <path d="M116 40 C 116 16, 132 8, 138 16 C 128 22, 128 32, 128 42 Z" fill="${c.body}"/>
      </g>
      <circle cx="116" cy="78" r="44" fill="${c.body}"/>
      <ellipse cx="128" cy="80" rx="27" ry="25" fill="${c.face}"/>
      <ellipse class="pr-cheek" cx="140" cy="98" rx="9" ry="6" fill="${c.cheek}" opacity=".7"/>
      <g class="pr-hat">
        <path d="M94 44 L118 2 L140 42 Z" fill="${c.cheek}" stroke="${c.ink}" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M104 26 L131 26 M99 36 L136 36" stroke="${c.beak}" stroke-width="5" stroke-linecap="round"/>
        <circle cx="118" cy="4" r="7" fill="${c.beak}" stroke="${c.ink}" stroke-width="2.5"/>
      </g>
      <g class="pr-eye">
        <circle cx="128" cy="74" r="12" fill="#fff" stroke="${c.ink}" stroke-width="2.5"/>
        <g class="pr-pupil"><circle cx="130" cy="74" r="6.5" fill="${c.ink}"/><circle cx="132.5" cy="71" r="2.2" fill="#fff"/></g>
        <rect class="pr-lid" x="114" y="60" width="28" height="28" rx="14" fill="${c.face}"/>
      </g>
      <g class="pr-beak">
        <path d="M150 80 C 172 80, 178 100, 166 116 C 164 104, 158 98, 146 96 Z" fill="${c.beak}" stroke="${c.ink}" stroke-width="2.5" stroke-linejoin="round"/>
        <path class="pr-jaw" d="M146 96 C 156 98, 162 104, 160 110 C 152 110, 146 104, 144 98 Z" fill="${c.beakDark}" stroke="${c.ink}" stroke-width="2" stroke-linejoin="round"/>
      </g>
    </g>
  </g>
</svg>`;
  }

  const css = `
.parrot{display:inline-block;line-height:0}
.parrot-svg{width:100%;height:auto;overflow:visible}
.pr-head{transform-box:view-box;transform-origin:112px 116px;transition:transform .35s cubic-bezier(.3,1.4,.5,1)}
.pr-pupil{transition:transform .25s ease-out}
.pr-lid{transform-box:fill-box;transform-origin:50% 0;transform:scaleY(0);animation:pr-blink 4.6s infinite}
.pr-all{transform-box:view-box;transform-origin:112px 220px;animation:pr-breathe 3.2s ease-in-out infinite}
.pr-wing{transform-box:view-box;transform-origin:84px 128px;transition:transform .45s cubic-bezier(.3,1.4,.5,1)}
.pr-book{opacity:0;transition:opacity .3s}
.pr-jaw{transform-box:view-box;transform-origin:146px 97px}
.parrot.talk .pr-jaw{animation:pr-talk .18s ease-in-out 6 alternate}
@keyframes pr-blink{0%,92%,100%{transform:scaleY(0)}95%{transform:scaleY(1)}}
@keyframes pr-breathe{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-3px) scale(1.01,.99)}}
@keyframes pr-wave{0%,100%{transform:rotate(-95deg)}50%{transform:rotate(-130deg)}}
@keyframes pr-hop{0%,100%{transform:translateY(0)}30%{transform:translateY(-26px) rotate(-4deg)}55%{transform:translateY(0)}70%{transform:translateY(-10px)}}
@keyframes pr-talk{to{transform:rotate(14deg)}}
@keyframes pr-tilt{0%,100%{transform:rotate(-14deg)}50%{transform:rotate(-8deg)}}
.parrot.p-wave .pr-wing{animation:pr-wave .5s ease-in-out infinite}
.parrot.p-point .pr-wing{transform:rotate(-70deg)}
.parrot.p-happy .pr-all{animation:pr-hop .9s ease-out infinite}
.parrot.p-happy .pr-wing{transform:rotate(-40deg)}
.parrot.p-think .pr-head{animation:pr-tilt 2s ease-in-out infinite}
.pr-hat{transform-box:view-box;transform-origin:117px 44px;transform:translateY(-30px) scale(.4);opacity:0;transition:transform .45s cubic-bezier(.3,1.5,.5,1),opacity .2s}
.parrot.p-party .pr-hat{transform:rotate(-8deg);opacity:1}
.parrot.p-party .pr-crest{opacity:0}
.parrot.p-party .pr-all{animation:pr-hop 1.1s ease-out 2}
.parrot.p-party .pr-wing{animation:pr-wave .45s ease-in-out 4}
.parrot.p-read .pr-book{opacity:1}
.parrot.p-read .pr-wing{transform:rotate(-8deg)}
.parrot.p-read .pr-pupil{transform:translate(-6px,6px)!important}
.parrot-say{position:absolute;left:50%;bottom:100%;transform:translate(-50%,6px) scale(.9);opacity:0;pointer-events:none;
  white-space:nowrap;line-height:1.25;transition:opacity .25s,transform .35s cubic-bezier(.3,1.4,.5,1)}
.parrot-say.on{opacity:1;transform:translate(-50%,-4px) scale(1)}
@media (prefers-reduced-motion:reduce){.pr-all,.pr-lid,.parrot *{animation:none!important;transition:none!important}}
`;

  function injectCSS() {
    if (document.getElementById('parrot-css')) return;
    const s = document.createElement('style'); s.id = 'parrot-css'; s.textContent = css;
    document.head.appendChild(s);
  }

  window.mountParrot = function (el, colors) {
    injectCSS();
    const c = Object.assign({ body: '#1E9C98', belly: '#BFE7DF', wing: '#137A78', beak: '#F5B82E', beakDark: '#D9951A', face: '#FFFDF6', cheek: '#FF9EB0', ink: '#163536', perch: '#9A6B45', leaf: '#7DBB6E' }, colors || {});
    el.classList.add('parrot');
    el.insertAdjacentHTML('beforeend', markup(c));
    const bubble = document.createElement('div'); bubble.className = 'parrot-say'; el.appendChild(bubble);
    const head = el.querySelector('.pr-head');
    const pupil = el.querySelector('.pr-pupil');
    const svg = el.querySelector('svg');
    let currentPose = '';
    let sayTimer;

    function lookAt(x, y) {
      const r = svg.getBoundingClientRect();
      const s = r.width / 220;
      const hx = r.left + 128 * s, hy = r.top + 76 * s;
      const dx = x - hx, dy = y - hy;
      // голова поворачивается: смотрит вниз-вверх наклоном, влево — лёгким разворотом
      let ang = Math.atan2(dy, Math.abs(dx) + 60) * 180 / Math.PI;
      ang = Math.max(-28, Math.min(32, ang));
      const flip = dx < -40 ? -1 : 1;
      head.style.transform = `rotate(${ang}deg)` + (flip < 0 ? ' translateX(-4px)' : '');
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 200);
      pupil.style.transform = `translate(${(dx / d) * 4.5 * k - (flip < 0 ? 3 : 0)}px, ${(dy / d) * 4.5 * k}px)`;
    }
    function lookHome() { head.style.transform = ''; pupil.style.transform = ''; }
    function pose(name) {
      if (name === currentPose) return;
      if (currentPose) el.classList.remove('p-' + currentPose);
      currentPose = name || '';
      if (currentPose) el.classList.add('p-' + currentPose);
    }
    function say(text, ms) {
      clearTimeout(sayTimer);
      if (!text) { bubble.classList.remove('on'); return; }
      bubble.textContent = text; bubble.classList.add('on');
      el.classList.remove('talk'); void el.offsetWidth; el.classList.add('talk');
      if (ms) sayTimer = setTimeout(() => bubble.classList.remove('on'), ms);
    }
    return { el, lookAt, lookHome, pose, say };
  };
})();
