/* ════════════════════════════════════════════════════════════════════
 *  Device harness runtime — NOT part of junoui.
 *  junoui's zero-JS rule applies to the LIBRARY. This file is the test
 *  instrument's driver: it inlines the icon sprite (Safari still does not
 *  resolve external <use href="file.svg#id"> references) and supplies the
 *  stateful bits the library deliberately omits — showModal(), toast
 *  timing, tab switching — so a human can actually open the things our
 *  headless suite never opens.
 * ════════════════════════════════════════════════════════════════════ */

// ── icon sprite ─────────────────────────────────────────────────────────
(async function injectSprite() {
  try {
    const res = await fetch('../../dist/icons/juno-icons.svg');
    const div = document.createElement('div');
    div.hidden = true;
    div.innerHTML = await res.text();
    document.body.prepend(div);
  } catch {
    /* file:// or offline — serve over http to get glyphs */
  }
})();

const icon = (name, cls = '') =>
  `<svg class="juno-icon ${cls}" aria-hidden="true"><use href="#juno-i-${name}" /></svg>`;

// ── overlays: open a <dialog> for real ──────────────────────────────────
// data-open="<id>"        → showModal()
// data-sheet-h="<len>"    → also sets --juno-sheet-h on the target (snap point)
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-open]');
  if (!t) return;
  const dlg = document.getElementById(t.dataset.open);
  if (!dlg) return;
  if (t.dataset.sheetH) dlg.style.setProperty('--juno-sheet-h', t.dataset.sheetH);
  dlg.showModal();
});

// ── alerts: dismiss ─────────────────────────────────────────────────────
document.addEventListener('click', (e) => {
  const x = e.target.closest('.juno-alert__close');
  if (x) x.closest('.juno-alert')?.remove();
});

// ── toasts: spawn + auto-dismiss (app policy, not junoui's) ─────────────
const TOAST_ICON = {
  nominal: 'check-circle',
  active: 'info',
  target: 'check-circle',
  caution: 'warning',
  warning: 'warning-circle',
};
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-toast]');
  if (!b) return;
  const stack = document.getElementById('toast-stack');
  if (!stack) return;
  const role = b.dataset.toast;
  const t = document.createElement('div');
  t.className = `juno-toast juno--${role}`;
  t.setAttribute('role', 'status');
  t.innerHTML =
    `<span class="juno-toast__icon">${icon(TOAST_ICON[role] || 'info')}</span>` +
    `<span class="juno-toast__text">${b.dataset.msg || 'Toast'}</span>` +
    `<button class="juno-toast__close" aria-label="Dismiss">${icon('x', 'juno-icon--sm')}</button>`;
  stack.appendChild(t);
  let gone = false;
  const remove = () => {
    if (gone) return;
    gone = true;
    t.classList.add('juno-toast--leaving');
    t.addEventListener('transitionend', () => t.remove(), { once: true });
    setTimeout(() => t.remove(), 400);
  };
  t.querySelector('.juno-toast__close').addEventListener('click', remove);
  setTimeout(remove, 4500);
});

// ── tabs: panel switching + roving focus (the ARIA contract junoui specs
//    but leaves to the app) ─────────────────────────────────────────────
document.querySelectorAll('.juno-tabs__list[role="tablist"]').forEach((list) => {
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  const select = (tab) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.hidden = !on;
    });
    tab.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  };
  list.addEventListener('click', (e) => {
    const tab = e.target.closest('[role="tab"]');
    if (tab && !tab.disabled) select(tab);
  });
  list.addEventListener('keydown', (e) => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = tabs[(i + d + tabs.length) % tabs.length];
    next.focus();
    select(next);
  });
});

// ── segmented / chip toggles: flip aria-pressed so the visual state is
//    reachable by touch ────────────────────────────────────────────────
document.addEventListener('click', (e) => {
  const b = e.target.closest('[aria-pressed]');
  if (!b || b.disabled) return;
  b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
});

// ── desktop viewport-framing switch ──────────────────────────────────────
// Real device: window.self === window.top here too, but there is nothing
// to switch TO (the page is already the honest mobile viewport) and no
// coarse/no-hover pointer needs an emulated one, so this whole block is
// skipped by the two guards below rather than by a UA sniff.
//
// Inside our own iframe (the "mobile" preview's nested browsing context):
// window.self !== window.top, so this block is skipped there too — that
// iframe is a real 390x844 page and must render exactly as a phone would,
// including its OWN copy of this script running the shims above on ITS
// document. Only the top-level desktop document gets the switch.
//
// WHAT THIS DOES NOT DO: (pointer: coarse) and (hover: none) describe the
// PRIMARY INPUT DEVICE, not frame geometry — a mouse-driven desktop stays
// a fine pointer inside a 390px-wide iframe exactly as it does inside a
// 390px-wide window. So this switch is honest for every width/height/dvh-
// keyed breakpoint (the vast majority of junoui's responsive surface) and
// gives NO signal at all for the pointer-coarse-gated recipes — the
// rail/dock-responsive swap (src/css/components/rail.css,
// dock-responsive.css), the tap-target promotion in base.css, the tree
// caret hit area. Those need a real touchscreen, the automated
// chromium-coarse Playwright project, or the explicitly-labeled
// "PREVIEW: COARSE POINTER (demo only)" override in
// showcase/swap-demo.html, which substitutes only the pointer half of that
// one conjunction and says so on the button.
(function initViewportSwitch() {
  if (window.self !== window.top) return;
  const isTouchPrimary = matchMedia('(pointer: coarse), (hover: none)').matches;
  if (isTouchPrimary) return;

  const stored = (() => {
    try {
      return localStorage.getItem('dh:preview');
    } catch {
      return null;
    }
  })();
  const persist = (mode) => {
    try {
      localStorage.setItem('dh:preview', mode);
    } catch {
      /* private mode / storage disabled — switch still works this load */
    }
  };

  const switchEl = document.createElement('div');
  switchEl.className = 'dh-viewport-switch';
  switchEl.innerHTML =
    '<button type="button" class="dh-viewport-switch__btn" data-dh-mode="desktop">Desktop</button>' +
    '<button type="button" class="dh-viewport-switch__btn" data-dh-mode="mobile">Mobile</button>';

  const frameWrap = document.createElement('div');
  frameWrap.className = 'dh-viewport-frame-wrap';
  // The iframe is created empty and only pointed at this page once the
  // operator actually asks for the mobile frame — an idle desktop tab
  // should not carry a second, hidden copy of the page doing work.
  const bezel = document.createElement('div');
  bezel.className = 'dh-viewport-frame-bezel';
  const frame = document.createElement('iframe');
  frame.className = 'dh-viewport-frame';
  frame.title = 'junoui device harness — mobile preview (390x844)';
  bezel.appendChild(frame);
  frameWrap.appendChild(bezel);

  const setMode = (mode) => {
    document.documentElement.dataset.dhPreview = mode === 'mobile' ? 'mobile' : 'desktop';
    switchEl
      .querySelectorAll('[data-dh-mode]')
      .forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.dhMode === mode)));
    if (mode === 'mobile') {
      // Reassigned every time (not guarded on frame.src already being set):
      // leaving mobile mode below removes the attribute outright, so this
      // is always a fresh load — a stale toast timer or open dialog from a
      // previous visit never survives a switch back.
      frame.src = location.pathname + location.search;
    } else {
      frame.removeAttribute('src'); // stop the nested page's timers/toasts while hidden
    }
    persist(mode);
  };

  switchEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-dh-mode]');
    if (btn) setMode(btn.dataset.dhMode);
  });

  document.body.append(switchEl, frameWrap);
  setMode(stored === 'mobile' ? 'mobile' : 'desktop');
})();
