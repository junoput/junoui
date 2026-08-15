// The floating bar's offset and the room reserved beneath it must agree — at
// any safe-area inset, and under a consumer's own choice of inset form.
//
// The defect this pins (20260815-055): the inset form used to be baked
// separately into dock.css's margin and into --juno-dock-clearance. A consumer
// whose design wants the bar flush above the home indicator writes max() at the
// margin; the clearance kept adding, and the two disagreed by 16px at inset 0
// and 24px at inset 34 — a dead band at the foot of the scroller, worst on the
// device the inset exists for. No value of --juno-dock-h could reconcile them,
// because one side added the inset and the other maxed it.
//
// Both now consume --juno-dock-edge-offset, so they agree by construction and
// the only difference between reserved and occupied is the breathing gap the
// consumer asked for.
//
// env() cannot be forced in Chromium, so the inset is substituted as a literal
// in the stylesheet. That is not a workaround for a missing feature: the thing
// in dispute is the ARITHMETIC, and substituting a known inset is the only way
// to check it at more than one value.
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const BUNDLE = join(dirname(dirname(dirname(fileURLToPath(import.meta.url)))), 'dist/css/juno.css');

const CONFIGS = [
  { name: 'junoui defaults', inset: 0, root: '', breathing: 8 },
  { name: 'junoui defaults, notched', inset: 34, root: '', breathing: 8 },
  {
    name: 'consumer: flush above the indicator, compact reservation, no breathing',
    inset: 0,
    root: '--juno-dock-edge-offset:max(8px,0px);--juno-dock-clearance-scale:.78;--juno-dock-clearance-breathing:0px',
    breathing: 0,
  },
  {
    name: 'consumer: same, notched',
    inset: 34,
    root: '--juno-dock-edge-offset:max(8px,34px);--juno-dock-clearance-scale:.78;--juno-dock-clearance-breathing:0px',
    breathing: 0,
  },
];

for (const cfg of CONFIGS) {
  test(`reserved space equals occupied space plus breathing — ${cfg.name}`, async ({ page }) => {
    const css = readFileSync(BUNDLE, 'utf8').replace(
      /env\(safe-area-inset-bottom, 0px\)/g,
      `${cfg.inset}px`,
    );
    await page.setContent(
      `<style>${css}</style><style>:root{${cfg.root}}</style>
       <div style="height:300px"></div>
       <nav class="juno-dock juno-dock--pill" id="d">
         <a class="juno-dock__item"><span class="juno-dock__bubble"></span></a>
       </nav>
       <div id="c" style="height:var(--juno-dock-clearance)"></div>`,
    );
    const m = await page.evaluate(() => {
      const d = document.getElementById('d');
      const scale =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            '--juno-dock-clearance-scale',
          ),
        ) || 1;
      return {
        occupied:
          d.getBoundingClientRect().height * scale + parseFloat(getComputedStyle(d).marginBottom),
        reserved: document.getElementById('c').getBoundingClientRect().height,
      };
    });
    // to 0.1px: the scale multiplies a fractional height
    expect(m.reserved - m.occupied).toBeCloseTo(cfg.breathing, 1);
  });
}
