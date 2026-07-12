// ════════════════════════════════════════════════════════════════════════
//  junoui demo runtime — NOT part of the published package.
// ════════════════════════════════════════════════════════════════════════
//  Demonstrates real consumption: theming is done purely by setting
//  data-juno-palette / data-juno-mode / data-juno-density on <html> (the CSS
//  does the rest), and the token table is read from the built JS module — the
//  same import a consuming app uses.
//
//  Shared across every showcase page: the chrome (header + nav + footer) is
//  injected here so the pages only carry their own <main>. Every page-specific
//  hook is null-guarded, so this one script drives them all.
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
  'data-dim',
  'label',
  'muted',
  'border',
  'border-strong',
  's0',
  's1',
  's2',
  's3',
];

const PAGES = [
  ['index.html', 'Overview'],
  ['foundations.html', 'Foundations'],
  ['buttons.html', 'Buttons'],
  ['forms.html', 'Forms'],
  ['data-display.html', 'Data display'],
  ['tables.html', 'Tables'],
  ['loaders.html', 'Loaders'],
  ['overlays.html', 'Overlays'],
  ['alerts.html', 'Alerts'],
  ['tabs.html', 'Tabs'],
  ['icons.html', 'Icons'],
  ['layout.html', 'Layout'],
  ['mobile.html', 'Mobile'],
];

// icon set — symbol ids in dist/icons/juno-icons.svg (without the juno-i- prefix)
const ICONS = [
  'house',
  'gear',
  'sliders-horizontal',
  'user',
  'users',
  'magnifying-glass',
  'funnel',
  'bell',
  'envelope',
  'chat-circle',
  'calendar-blank',
  'clock',
  'check',
  'check-circle',
  'x',
  'x-circle',
  'warning',
  'warning-circle',
  'info',
  'question',
  'plus',
  'minus',
  'trash',
  'pencil-simple',
  'copy',
  'floppy-disk',
  'download',
  'upload',
  'link',
  'folder',
  'file',
  'list',
  'dots-three',
  'dots-three-vertical',
  'caret-up',
  'caret-down',
  'caret-left',
  'caret-right',
  'arrow-clockwise',
  'arrow-up',
  'arrow-down',
  'arrow-left',
  'arrow-right',
  'eye',
  'eye-slash',
  'lock',
  'lock-open',
  'heart',
  'star',
  'sun',
  'moon',
  // media / distributed-systems domain (2026-07 batch)
  'squares-four',
  'images',
  'hexagon',
  'puzzle-piece',
  'play',
  'film-strip',
  'cloud',
  'cloud-arrow-down',
  'arrows-clockwise',
  'cpu',
  'hard-drives',
  'sliders',
  'arrows-out',
  'upload-simple',
];
const ICON_SPRITE = '../dist/icons/juno-icons.svg';

// inline the sprite once so every page can reference symbols by short id
// (#juno-i-<name>) — keeps currentColor tinting reliable inside role contexts.
async function injectSprite() {
  try {
    const res = await fetch(ICON_SPRITE);
    const div = document.createElement('div');
    div.hidden = true;
    div.innerHTML = await res.text();
    document.body.prepend(div);
  } catch {
    /* offline / file:// — static external <use href> refs still work over http */
  }
}
const icon = (name, cls = '') =>
  `<svg class="juno-icon ${cls}" aria-hidden="true"><use href="#juno-i-${name}" /></svg>`;

// ── shared chrome (header + nav + footer) ────────────────────────────────
function renderChrome() {
  const here = location.pathname.split('/').pop() || 'index.html';
  const nav = PAGES.map(
    ([href, label]) =>
      `<a href="./${href}"${href === here ? ' aria-current="page"' : ''}>${label}</a>`,
  ).join('');

  const header = document.createElement('header');
  header.className = 'demo-header';
  header.innerHTML = `
    <a href="./index.html" style="display:flex;align-items:center;gap:12px;text-decoration:none;">
      <span class="juno-mono" style="font-size:16px;font-weight:700;color:var(--juno-nominal);letter-spacing:.2em;">junoui</span>
      <span class="juno-eyebrow">design system</span>
    </a>
    <div class="demo-spacer"></div>
    <div class="demo-ctl">
      <span class="juno-eyebrow">Palette</span>
      <div class="demo-seg">
        <button class="demo-toggle" data-palette="standard">STANDARD</button>
        <button class="demo-toggle" data-palette="colorblind">COLORBLIND</button>
        <button class="demo-toggle" data-palette="soft">SOFT</button>
      </div>
    </div>
    <div class="demo-ctl">
      <span class="juno-eyebrow">Mode</span>
      <div class="demo-seg">
        <button class="demo-toggle" data-mode="dark">${icon('moon', 'juno-icon--sm')} DARK</button>
        <button class="demo-toggle" data-mode="light">${icon('sun', 'juno-icon--sm')} LIGHT</button>
      </div>
    </div>
    <div class="demo-ctl">
      <span class="juno-eyebrow">Density</span>
      <div class="demo-seg">
        <button class="demo-toggle" data-density="comfortable">COMFORTABLE</button>
        <button class="demo-toggle" data-density="compact">COMPACT</button>
      </div>
    </div>
    <div class="demo-ctl">
      <span class="juno-eyebrow">Text</span>
      <div class="demo-seg">
        <button class="demo-toggle" data-text="base">A</button>
        <button class="demo-toggle" data-text="large">A+</button>
        <button class="demo-toggle" data-text="xl">A++</button>
      </div>
    </div>
    <span class="juno-mono juno-text-data" id="clock" style="font-size:13px;"></span>`;

  const navEl = document.createElement('nav');
  navEl.className = 'demo-nav';
  navEl.innerHTML = nav;

  document.body.prepend(navEl);
  document.body.prepend(header);

  const footer = document.createElement('footer');
  footer.className = 'demo-footer';
  footer.innerHTML = `
    <span class="juno-mono juno-text-nominal" style="letter-spacing:.2em;">junoui</span>
    <span class="juno-text-muted" style="font-size:11px;">junoui · interactive demo · not shipped in the npm package</span>`;
  document.body.append(footer);
}

// ── theme toggles ────────────────────────────────────────────────────────
function syncToggles() {
  const { junoPalette: p, junoMode: m, junoDensity: d, junoText: tx } = html.dataset;
  document
    .querySelectorAll('[data-palette]')
    .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.palette === p)));
  document
    .querySelectorAll('[data-mode]')
    .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
  document
    .querySelectorAll('[data-density]')
    .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.density === d)));
  document
    .querySelectorAll('[data-text]')
    .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.text === (tx || 'base'))));
  const cap = document.getElementById('tokens-caption');
  if (cap) cap.textContent = `Color tokens — ${p} / ${m}`;
  renderTokens();
}

// theme persists across page navigation + refresh (per-browser)
const PREFS = {
  palette: 'juno:palette',
  mode: 'juno:mode',
  density: 'juno:density',
  text: 'juno:text',
};
const savePref = (key, val) => {
  try {
    localStorage.setItem(key, val);
  } catch {
    /* private mode / disabled storage — fall back to in-memory only */
  }
};

document.addEventListener('click', (e) => {
  const pb = e.target.closest('[data-palette]');
  const mb = e.target.closest('[data-mode]');
  const db = e.target.closest('[data-density]');
  const xb = e.target.closest('[data-text]');
  if (pb) savePref(PREFS.palette, (html.dataset.junoPalette = pb.dataset.palette));
  if (mb) savePref(PREFS.mode, (html.dataset.junoMode = mb.dataset.mode));
  if (db) savePref(PREFS.density, (html.dataset.junoDensity = db.dataset.density));
  if (xb) savePref(PREFS.text, (html.dataset.junoText = xb.dataset.text));
  if (pb || mb || db || xb) syncToggles();
});

// ── modal + pressed toggles (demo wiring — apps own this, not junoui) ─────
//  Popover + menu need no JS: they use the native Popover API (popovertarget),
//  so open/close, light-dismiss, and ESC are the platform's job.
document.addEventListener('click', (e) => {
  const open = e.target.closest('[data-open]');
  if (open) document.getElementById(open.dataset.open)?.showModal();

  const tb = e.target.closest('.juno-toggle-btn:not(:disabled)');
  if (tb) tb.setAttribute('aria-pressed', String(tb.getAttribute('aria-pressed') !== 'true'));

  // chips: toggle filter chips, and dismiss removable ones (demo wiring)
  const rm = e.target.closest('.juno-chip__remove');
  if (rm) {
    rm.closest('.juno-chip')?.remove();
    return;
  }
  const ct = e.target.closest('.juno-chip--toggle:not(:disabled)');
  if (ct) ct.setAttribute('aria-pressed', String(ct.getAttribute('aria-pressed') !== 'true'));
});

// ── sliders (demo: app drives value%, drag + keys; junoui ships the look) ─
function initSliders() {
  document.querySelectorAll('.juno-slider').forEach((el) => {
    const lo = +el.getAttribute('aria-valuemin') || 0;
    const hi = +el.getAttribute('aria-valuemax') || 100;
    const step = hi - lo > 100 ? 10 : 1;
    const out = el.parentElement.querySelector('.js-sval');
    const setVal = (v) => {
      v = Math.max(lo, Math.min(hi, Math.round(v / step) * step));
      el.setAttribute('aria-valuenow', v);
      el.style.setProperty('--juno-slider-pct', ((v - lo) / (hi - lo)) * 100);
      if (out) out.textContent = v;
    };
    const fromX = (x) => {
      const r = el.getBoundingClientRect();
      return lo + Math.max(0, Math.min(1, (x - r.left) / r.width)) * (hi - lo);
    };
    setVal(+el.getAttribute('aria-valuenow') || lo);
    if (el.getAttribute('aria-disabled') === 'true') return;
    el.addEventListener('pointerdown', (e) => {
      el.setPointerCapture(e.pointerId);
      setVal(fromX(e.clientX));
      const mv = (ev) => setVal(fromX(ev.clientX));
      const up = () => {
        el.removeEventListener('pointermove', mv);
        el.removeEventListener('pointerup', up);
      };
      el.addEventListener('pointermove', mv);
      el.addEventListener('pointerup', up);
    });
    el.addEventListener('keydown', (e) => {
      const cur = +el.getAttribute('aria-valuenow') || lo;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') (setVal(cur + step), e.preventDefault());
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') (setVal(cur - step), e.preventDefault());
    });
  });
}

// ── tooltips: promote each bubble to a top-layer hint popover so it can't be
//  clipped by an ancestor's overflow. Stateless enhancer — show on hover/focus
//  of the trigger, hide on leave/blur; CSS owns the look (a no-JS consumer
//  still gets the pure-CSS hover reveal, just clippable). ───────────────────
function initTooltips() {
  document.querySelectorAll('.juno-tooltip').forEach((wrap, i) => {
    const trigger = wrap.querySelector('button, [tabindex]');
    const bubble = wrap.querySelector('.juno-tooltip__bubble');
    if (!trigger || !bubble || !('popover' in bubble)) return;
    const name = `--juno-tip-${i}`;
    trigger.style.anchorName = name;
    bubble.style.positionAnchor = name;
    bubble.popover = 'hint';
    const show = () => bubble.matches(':popover-open') || bubble.showPopover();
    const hide = () => bubble.matches(':popover-open') && bubble.hidePopover();
    trigger.addEventListener('pointerenter', show);
    trigger.addEventListener('pointerleave', hide);
    trigger.addEventListener('focus', show);
    trigger.addEventListener('blur', hide);
  });
}

// ── tables (demo: app owns sort/filter/select/edit; junoui ships the look) ─
function initTables() {
  document.querySelectorAll('.juno-table[data-interactive]').forEach((table) => {
    const tbody = table.tBodies[0];
    const rows = () => [...tbody.rows];
    const visibleRows = () => rows().filter((r) => !r.hidden);

    // sort — by actual column index so a checkbox column doesn't offset it
    table.querySelectorAll('thead th[aria-sort]').forEach((th) => {
      th.addEventListener('click', () => {
        const ci = th.cellIndex;
        const dir = th.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';
        table
          .querySelectorAll('thead th[aria-sort]')
          .forEach((o) => o.setAttribute('aria-sort', 'none'));
        th.setAttribute('aria-sort', dir);
        const num = th.classList.contains('juno-table__num');
        const val = (tr) => tr.cells[ci].textContent.trim();
        rows()
          .sort((a, b) => {
            if (num) {
              const x = parseFloat(val(a).replace(/[^0-9.-]/g, '')) || 0;
              const y = parseFloat(val(b).replace(/[^0-9.-]/g, '')) || 0;
              return dir === 'ascending' ? x - y : y - x;
            }
            return dir === 'ascending'
              ? val(a).localeCompare(val(b))
              : val(b).localeCompare(val(a));
          })
          .forEach((r) => tbody.appendChild(r));
        render();
      });
    });

    // selection — checkbox column + select-all + bulk bar
    const bar = document.querySelector(`[data-bulk="${table.id}"]`);
    const all = table.querySelector('[data-select-all]');
    const setRow = (tr, on) => {
      tr.setAttribute('aria-selected', String(on));
      const cb = tr.querySelector('[data-row-check]');
      if (cb) cb.checked = on;
    };
    const sync = () => {
      const vis = visibleRows();
      const selVis = vis.filter((r) => r.getAttribute('aria-selected') === 'true');
      if (all) {
        all.checked = vis.length > 0 && selVis.length === vis.length;
        all.indeterminate = selVis.length > 0 && selVis.length < vis.length;
      }
      if (bar) {
        const n = rows().filter((r) => r.getAttribute('aria-selected') === 'true').length;
        bar.hidden = n === 0;
        const c = bar.querySelector('.juno-table__bulk-count');
        if (c) c.textContent = `${n} SELECTED`;
      }
    };
    tbody.querySelectorAll('[data-row-check]').forEach((cb) => {
      cb.addEventListener('change', () => {
        setRow(cb.closest('tr'), cb.checked);
        sync();
      });
    });
    all?.addEventListener('change', () => {
      visibleRows().forEach((r) => setRow(r, all.checked));
      sync();
    });
    bar?.querySelector('[data-bulk-clear]')?.addEventListener('click', () => {
      rows().forEach((r) => setRow(r, false));
      sync();
    });

    // bulk actions — operate on the current selection, then clear it
    const setStatus = (row, text, role) => {
      const b = row.querySelector('.juno-badge');
      if (!b) return;
      b.className = `juno-badge juno-badge--soft juno--${role}`;
      b.textContent = text;
    };
    bar?.querySelectorAll('[data-bulk-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sel = rows().filter((r) => r.getAttribute('aria-selected') === 'true');
        const act = btn.dataset.bulkAction;
        if (act === 'scale') sel.forEach((r) => r.remove());
        else if (act === 'restart') sel.forEach((r) => setStatus(r, 'RESTARTING', 'active'));
        else if (act === 'drain') sel.forEach((r) => setStatus(r, 'DRAINING', 'caution'));
        sel.forEach((r) => r.isConnected && setRow(r, false));
        render();
      });
    });

    // filter + pagination — one render() applies both and updates the footer
    const input = document.querySelector(`[data-filter="${table.id}"]`);
    const count = document.querySelector(`[data-count="${table.id}"]`);
    const rangeEl = document.querySelector(`[data-range="${table.id}"]`);
    const pageEl = document.querySelector(`[data-page="${table.id}"]`);
    const prevBtn = document.querySelector(`[data-prev="${table.id}"]`);
    const nextBtn = document.querySelector(`[data-next="${table.id}"]`);
    const sizeGroup = document.querySelector(`[data-pagesize="${table.id}"]`);
    let page = 0;
    let pageSize = 5;

    function render() {
      const q = (input?.value || '').trim().toLowerCase();
      const matched = rows().filter((r) => q === '' || r.textContent.toLowerCase().includes(q));
      const size = pageSize === 'all' ? Math.max(1, matched.length) : pageSize;
      const pageCount = Math.max(1, Math.ceil(matched.length / size));
      page = Math.min(Math.max(0, page), pageCount - 1);
      const start = page * size;
      rows().forEach((r) => {
        r.hidden = true;
      });
      matched.forEach((r, i) => {
        r.hidden = !(i >= start && i < start + size);
      });
      if (count) count.textContent = `${matched.length} / ${rows().length}`;
      if (rangeEl)
        rangeEl.textContent = matched.length
          ? `${start + 1}–${Math.min(start + size, matched.length)} of ${matched.length}`
          : '0 of 0';
      if (pageEl) pageEl.textContent = `${page + 1} / ${pageCount}`;
      if (prevBtn) prevBtn.disabled = page === 0;
      if (nextBtn) nextBtn.disabled = page >= pageCount - 1;
      sizeGroup
        ?.querySelectorAll('[data-page-size]')
        .forEach((b) =>
          b.classList.toggle('juno-btn--ghost', String(pageSize) !== b.dataset.pageSize),
        );
      sync();
    }

    input?.addEventListener('input', () => {
      page = 0;
      render();
    });
    prevBtn?.addEventListener('click', () => {
      page -= 1;
      render();
    });
    nextBtn?.addEventListener('click', () => {
      page += 1;
      render();
    });
    sizeGroup?.querySelectorAll('[data-page-size]').forEach((b) => {
      b.addEventListener('click', () => {
        pageSize = b.dataset.pageSize === 'all' ? 'all' : Number(b.dataset.pageSize);
        page = 0;
        render();
      });
    });

    // zebra toggle
    const zebra = document.querySelector(`[data-zebra="${table.id}"]`);
    zebra?.addEventListener('change', () =>
      table.classList.toggle('juno-table--zebra', zebra.checked),
    );

    // inline edit — double-click a marked cell; Enter commits, Esc cancels
    tbody.querySelectorAll('td[data-edit]').forEach((td) => {
      td.addEventListener('dblclick', () => {
        if (td.querySelector('.juno-table__edit-input')) return;
        const mark = td.querySelector('.juno-table__mark');
        const prev = mark ? mark.textContent : td.textContent.trim();
        const field = document.createElement('input');
        field.className = 'juno-table__edit-input';
        field.value = prev;
        td.textContent = '';
        td.appendChild(field);
        field.focus();
        field.select();
        const commit = () => {
          let v = field.value.trim();
          if (td.dataset.edit === 'num') v = v.replace(/[^0-9.-]/g, '') || prev;
          td.innerHTML = '<span class="juno-table__mark"></span>';
          td.querySelector('.juno-table__mark').textContent = v || prev;
        };
        field.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') (e.preventDefault(), field.blur());
          else if (e.key === 'Escape') (e.preventDefault(), (field.value = prev), field.blur());
        });
        field.addEventListener('blur', commit, { once: true });
      });
    });

    render();
  });
}

// ── alerts + toasts (demo: app owns dismiss + auto-timeout) ──────────────
const TOAST_ICON = {
  nominal: 'check-circle',
  active: 'info',
  target: 'check-circle',
  caution: 'warning',
  warning: 'warning-circle',
};
function showToast(stack, role, msg) {
  const t = document.createElement('div');
  t.className = `juno-toast juno--${role}`;
  t.setAttribute('role', 'status');
  t.innerHTML =
    `<span class="juno-toast__icon">${icon(TOAST_ICON[role] || 'info')}</span>` +
    `<span class="juno-toast__text">${msg}</span>` +
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
  setTimeout(remove, 4000);
}

function initAlerts() {
  document.addEventListener('click', (e) => {
    const close = e.target.closest('.juno-alert__close');
    if (close) close.closest('.juno-alert')?.remove();

    const trig = e.target.closest('[data-toast]');
    if (trig) {
      const stack = document.getElementById(trig.dataset.toastStack || 'toast-stack');
      if (stack) showToast(stack, trig.dataset.toast, trig.dataset.msg || 'Notification');
    }
  });
}

// ── tabs (demo: app owns switching + roving focus; junoui ships the look) ─
function initTabs() {
  document.querySelectorAll('.juno-tabs').forEach((tabs) => {
    const tablist = tabs.querySelector('[role="tablist"]');
    if (!tablist) return;
    const items = [...tablist.querySelectorAll('[role="tab"]')];
    const select = (tab) => {
      items.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
    };
    items.forEach((tab) => {
      tab.addEventListener('click', () => {
        if (!tab.disabled) select(tab);
      });
      tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1;
    });
    tablist.addEventListener('keydown', (e) => {
      const enabled = items.filter((t) => !t.disabled);
      const i = enabled.indexOf(document.activeElement);
      if (i < 0) return;
      let next;
      if (e.key === 'ArrowRight') next = enabled[(i + 1) % enabled.length];
      else if (e.key === 'ArrowLeft') next = enabled[(i - 1 + enabled.length) % enabled.length];
      else if (e.key === 'Home') next = enabled[0];
      else if (e.key === 'End') next = enabled[enabled.length - 1];
      if (next) {
        e.preventDefault();
        select(next);
        next.focus();
      }
    });
  });
}

// ── token table (values straight from the JS module) ────────────────────
function renderTokens() {
  const grid = document.getElementById('token-grid');
  if (!grid) return;
  const t = TOKENS[html.dataset.junoPalette][html.dataset.junoMode];
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

// ── icon gallery (demo only — reads symbol ids from the sprite) ──────────
function renderIcons() {
  const grid = document.getElementById('icon-gallery');
  if (!grid) return;
  const count = document.getElementById('icon-count');
  if (count) count.textContent = ICONS.length;
  grid.innerHTML = ICONS.map(
    (name) => `
    <div title="${name}" style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px 8px;background:var(--juno-s1);border:1px solid var(--juno-border);border-radius:var(--juno-radius-4);">
      <svg class="juno-icon juno-icon--lg"><use href="${ICON_SPRITE}#juno-i-${name}" /></svg>
      <code class="juno-mono juno-text-label" style="font-size:10px;text-align:center;">${name}</code>
    </div>`,
  ).join('');
}

// ── live clock ──────────────────────────────────────────────────────────
function tick() {
  const el = document.getElementById('clock');
  if (!el) return;
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  el.textContent = `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

// ── determinate-loader progress (demo only) ──────────────────────────────
let progress = 0;
function driveProgress() {
  if (!document.querySelector('[data-prog]')) return;
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

renderChrome();
injectSprite();
const loadPref = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
html.dataset.junoPalette = loadPref(PREFS.palette) ?? html.dataset.junoPalette ?? 'standard';
html.dataset.junoMode = loadPref(PREFS.mode) ?? html.dataset.junoMode ?? 'dark';
html.dataset.junoDensity = loadPref(PREFS.density) ?? html.dataset.junoDensity ?? 'comfortable';
html.dataset.junoText = loadPref(PREFS.text) ?? html.dataset.junoText ?? 'base';
initSliders();
initTooltips();
initTables();
initAlerts();
initTabs();
renderIcons();
syncToggles();
tick();
setInterval(tick, 1000);
driveProgress();
setInterval(driveProgress, 55);
