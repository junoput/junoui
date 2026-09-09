---
'@junoput01/junoui': patch
---

Packaging: `@junoput01/junoui/pointer-first` now has an `exports` entry. The
file already shipped (`tools/` is in `files`) and `docs/painted-ui.md`
advertised the specifier, but with an `exports` map present an unlisted subpath
is blocked — so importing it threw `ERR_PACKAGE_PATH_NOT_EXPORTED`. Additive:
no existing export changes.
