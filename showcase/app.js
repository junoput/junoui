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
const ROLES = ['nominal', 'active', 'target', 'caution', 'warning', 'data', 'label', 'muted', 'border', 's0', 's1', 's2', 's3'];

// ── theme toggles ───────────────────────────────────────────────────────
function syncToggles() {
  const { junoPalette: p, junoMode: m } = html.dataset;
  document.querySelectorAll('[data-palette]').forEach((b) =>
    b.setAttribute('aria-pressed', String(b.dataset.palette === p)));
  document.querySelectorAll('[data-mode]').forEach((b) =>
    b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
  document.getElementById('tokens-caption').textContent =
    `Color Tokens — ${p} / ${m}`;
  renderTokens();
}

document.addEventListener('click', (e) => {
  const pb = e.target.closest('[data-palette]');
  const mb = e.target.closest('[data-mode]');
  if (pb) html.dataset.junoPalette = pb.dataset.palette;
  if (mb) html.dataset.junoMode = mb.dataset.mode;
  if (pb || mb) syncToggles();
});

// ── token table (values straight from the JS module) ────────────────────
function renderTokens() {
  const t = TOKENS[html.dataset.junoPalette][html.dataset.junoMode];
  const grid = document.getElementById('token-grid');
  grid.innerHTML = ROLES.map((role) => `
    <div style="display:flex;align-items:center;gap:12px;padding:10px 16px;background:var(--juno-s1);border:1px solid var(--juno-border);border-radius:var(--juno-radius-4);">
      <span class="demo-swatch" style="background:var(--juno-${role});"></span>
      <code class="juno-mono" style="font-size:12px;color:var(--juno-${role});">--juno-${role}</code>
      <span class="demo-spacer"></span>
      <code class="juno-mono juno-text-label" style="font-size:11px;">${t[role]}</code>
    </div>`).join('');
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
  document.querySelectorAll('[data-prog]').forEach((el) =>
    el.style.setProperty('--juno-progress', progress));
  document.querySelectorAll('[data-pct]').forEach((el) => { el.textContent = pct + '%'; });
}

syncToggles();
tick();
setInterval(tick, 1000);
driveProgress();
setInterval(driveProgress, 55);
