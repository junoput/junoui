---
'@junoput01/junoui': patch
---

Comment-only correction in `pillbar.css`: the width cap's comment named the wrong
safe-area bucket. `src/css` ships and the bundler keeps comments, so the shipped
`dist/css/juno.css` changes — no rule, selector, token or value does.
