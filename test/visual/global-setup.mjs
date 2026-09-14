// Say, at the top of every local run, that this box is not a valid check env
// for the committed baselines (20260914-156).
//
// The decision itself is not new and is not this file's to make: both
// `playwright.config.mjs` and CONTRIBUTING.md already state that a Linux dev box
// diffs 64–3387px on roughly two thirds of the showcase pages purely from text
// rendering, that the `-linux` baselines are authored on the pinned ubuntu-24.04
// runner, and that the fix is never to re-record locally (20260803-001).
//
// WHAT WAS MISSING IS THE RUNTIME SIGNAL. A local run answers with a screenshot
// diff and a pixel count, which reads exactly like a regression, and the reader
// only learns otherwise by opening the config. That cost a real investigation
// today: two dozen red showcase shots were chased through a control worktree, a
// five-day-old server and a font-environment hypothesis before anyone re-read
// the config that predicts them.
//
// IT PRINTS AND DOES NOT ASSERT, deliberately. An assertion here would be a gate
// step that fails for being on the wrong machine, and the failure it would
// produce is the one this message exists to explain. A note that is always
// available is worth more than a verdict that is sometimes wrong.
export default function globalSetup() {
  if (process.env.CI) return;

  // stderr, not stdout: the reporters own stdout, and a banner interleaved into
  // their output is the thing readers filter away first.
  process.stderr.write(
    [
      '',
      '  ── visual regression: this is not CI ──────────────────────────────────',
      '  The committed `-linux` baselines are authored on the pinned ubuntu-24.04',
      '  runner. A Linux dev box renders text differently and diffs 64-3387px on',
      '  ~2/3 of the showcase pages for that reason alone, so SHOWCASE FAILURES',
      '  HERE ARE EXPECTED AND ARE NOT EVIDENCE OF A REGRESSION (20260803-001).',
      '',
      '  Geometry specs — tap targets, safe-area, placement, fold, doctor — do not',
      '  screenshot and ARE meaningful locally. Read those.',
      '',
      '  To check a visual change: record a throwaway local baseline set first and',
      '  diff against THAT, or `gh workflow run visual-baselines.yml`. Never',
      '  re-record the committed ones locally. See CONTRIBUTING.md.',
      '  ──────────────────────────────────────────────────────────────────────',
      '',
    ].join('\n'),
  );
}
