---
'@junoput01/junoui': patch
---

Re-renders the devbox convention documents to v6 and adds
`docs/OBSERVABILITY.vocabulary.json`, the machine-readable form of the security-event
vocabulary. `docs/` is published, so the new file reaches consumers in the tarball; the four
other documents change by one line each (the version stamp) and `docs/OBSERVABILITY.md` gains
an extraction note. No rule changed, and nothing about the library's API, tokens or CSS
changes.
