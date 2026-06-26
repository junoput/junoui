// ════════════════════════════════════════════════════════════════════════
//  junoui demo runtime — NOT part of the published package.
// ════════════════════════════════════════════════════════════════════════
//  Demonstrates real consumption: theming is done purely by setting
//  data-juno-palette / data-juno-mode on <html> (the CSS does the rest),
//  and the token table is read from the built JS module — the same import
//  a consuming app uses.
// ════════════════════════════════════════════════════════════════════════

import { TOKENS } from '../dist/js/tokens.js';

const html = document.documentElement;
const ROLES = [
  'nominal',
  'active',
  'target',
  'caution',
  'warning',
  'data',
  'label',
  'muted',
  'border',
  's0',
  's1',
  's2',
  's3',
];

// ── theme toggles ───────────────────────────────────────────────────────
function syncToggles() {
  const { junoPalette: p, junoMode: m, junoDensity: d } = html.dataset;
  document
    .querySelectorAll('[data-palette]')
    .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.palette === p)));
  document
    .querySelectorAll('[data-mode]')
    .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
  document
    .querySelectorAll('[data-density]')
    .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.density === d)));
  document.getElementById('tokens-caption').textContent = `Color Tokens — ${p} / ${m}`;
  renderTokens();
}

document.addEventListener('click', (e) => {
  const pb = e.target.closest('[data-palette]');
  const mb = e.target.closest('[data-mode]');
  const db = e.target.closest('[data-density]');
  if (pb) html.dataset.junoPalette = pb.dataset.palette;
  if (mb) html.dataset.junoMode = mb.dataset.mode;
  if (db) html.dataset.junoDensity = db.dataset.density;
  if (pb || mb || db) syncToggles();
});

// ── overlays (demo wiring — apps own this behavior, not junoui) ──────────
document.addEventListener('click', (e) => {
  const open = e.target.closest('[data-open]');
  if (open) document.getElementById(open.dataset.open)?.showModal();

  // toggle popover / menu panels via [hidden] + aria-expanded
  const trig = e.target.closest('[data-toggle]');
  document.querySelectorAll('[data-overlay]').forEach((panel) => {
    const owner = panel.id === trig?.dataset.toggle;
    const wasHidden = panel.hidden;
    if (!owner) panel.hidden = true;
    else panel.hidden = !wasHidden;
    document
      .querySelector(`[data-toggle="${panel.id}"]`)
      ?.setAttribute('aria-expanded', String(!panel.hidden));
  });
  // click outside closes any open panel
  if (!trig && !e.target.closest('[data-overlay]')) {
    document.querySelectorAll('[data-overlay]').forEach((p) => (p.hidden = true));
    document
      .querySelectorAll('[data-toggle]')
      .forEach((b) => b.setAttribute('aria-expanded', 'false'));
  }
});

// ── token table (values straight from the JS module) ────────────────────
function renderTokens() {
  const t = TOKENS[html.dataset.junoPalette][html.dataset.junoMode];
  const grid = document.getElementById('token-grid');
  grid.innerHTML = ROLES.map(
    (role) => `
    <div style="display:flex;align-items:center;gap:12px;padding:10px 16px;background:var(--juno-s1);border:1px solid var(--juno-border);border-radius:var(--juno-radius-4);">
      <span class="demo-swatch" style="background:var(--juno-${role});"></span>
      <code class="juno-mono" style="font-size:12px;color:var(--juno-${role});">--juno-${role}</code>
      <span class="demo-spacer"></span>
      <code class="juno-mono juno-text-label" style="font-size:11px;">${t[role]}</code>
    </div>`,
  ).join('');
}

// ── live clock ──────────────────────────────────────────────────────────
function tick() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  document.getElementById('clock').textContent =
    `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

// ── determinate-loader progress (demo only) ──────────────────────────────
let progress = 0;
function driveProgress() {
  progress += 1.1;
  if (progress >= 100) progress = 0;
  const pct = Math.round(progress);
  document
    .querySelectorAll('[data-prog]')
    .forEach((el) => el.style.setProperty('--juno-progress', progress));
  document.querySelectorAll('[data-pct]').forEach((el) => {
    el.textContent = pct + '%';
  });
}

html.dataset.junoDensity ??= 'comfortable';
syncToggles();
tick();
setInterval(tick, 1000);
driveProgress();
setInterval(driveProgress, 55);
