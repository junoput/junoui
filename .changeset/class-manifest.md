---
'@junoput01/junoui': minor
---

**Class manifest + `junoui/testing` — conformance kit slice 1.**

A `juno-*` class name in a consumer's source is a string that has to match something in junoui's stylesheet, and nothing checked it. When it does not match, nothing fails: the file compiles, the tests pass, and the element renders as unstyled UA defaults. One consumer shipped eleven such names in a dialog; on a phone that put the confirm button off the bottom of the screen with no way to reach it. junoui had the same defect pointing the other way — `.juno-seg__option` sat in a `touch-action` list that never matched anything, because the shipped class is `.juno-seg__opt`.

**New: `junoui/classes.json`**, generated at build time from the bundle's own selectors — `all`, `public` (the documented subset), `roles`, `components` grouped BEM-wise, plus the other `juno-*` namespaces junoui ships and a consumer writes as bare strings: `tokens`, `keyframes`, `icons`.

**New: `junoui/testing`**, dependency-free and framework-agnostic:

```js
import { assertJunoClasses } from 'junoui/testing';
assertJunoClasses(['src/**/*.tsx'], { allowed: ['my-own-juno-namespaced-thing'] });
```

It throws with every offending `file: name`, and throws rather than passing when its globs match no files.

**What it answers:** "junoui ships nothing by this name." **What it does not:** whether the class still does what your component assumes.

Nothing existing changes; both entries are additive.
