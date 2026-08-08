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
