---
'@junoput01/junoui': patch
---

**Fixed a shipped export that threw for every real consumer.** `@junoput01/junoui/pointer-first`
resolved fine inside this repo and threw `ERR_MODULE_NOT_FOUND` the moment it
was imported from an actual `npm install` — `tools/pointer-first.mjs` re-exported
from `scripts/rules.mjs`, and `scripts/` is not in `package.json` `files`. The
file resolves locally because this repo happens to have a `scripts/` directory
too; a consumer's `node_modules` copy does not.

Caught by a new import guard (`test/exports-import.test.mjs`) that imports
every JS/JSON export target from a real packed-and-extracted tarball rather
than from the repo tree — the same class of gap `test/exports-map.test.mjs`
already covers for an export's own target (the 0.4.0 defect), extended one hop
to the target's own imports. `test/exports-map.test.mjs`'s existing checks
could not have caught this: the file itself exists, ships, and is listed in
the exports map correctly. Only what it imports was broken.

Fixed by moving the shared rule table into `tools/rules.mjs` — the same
directory as its only shipped consumer, so there is no package boundary left
to cross. No behavior change: the values and functions are unchanged, only
their file's address.
