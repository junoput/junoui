---
'@junoput01/junoui': minor
---

The rules a painted consumer cannot call now ship as Rust functions (`20260901-051`).

junoui is CSS and DOM. A consumer that **draws** its UI — canvas, egui, wgpu — got the token values from `juno_tokens.rs` and nothing else: a media query is not available to a render loop, `text-shadow` has no painter equivalent, and `min-block-size` is not something you set on a circle you are about to draw. So it re-derives. One consumer independently re-derived three rules this library already knew, in a single day.

New `dist/rust/juno_rules.rs` (exported as `junoui/rules`):

```rust
wants_compact_nav(width, height, coarse) -> bool
tap_min(coarse) -> f32
ring_diameter_for_marks(marks, tap_px) -> f32
labels_that_clear(marks, ratio, radius_px, glyph_px) -> u32
halo_offsets(font_px, halo_width_px, reference_px) -> [(f32, f32); 4]
```

Each rule is defined once in `scripts/rules.mjs`. `tools/pointer-first.mjs` re-exports it rather than restating it, the Rust is generated from it, and the Rust's `#[test]` bodies are generated from the same `CASES` table the JS tests run — so a case covers both targets or neither.

**One limit, stated because it would be easy to imply otherwise:** Node cannot check that a Rust body computes what its JS twin computes. `npm run test:rust` does, by running the generated tests, and it **refuses** rather than skips when no toolchain is present. junoui's CI has no Rust toolchain, so a divergent Rust body will not be caught there. Found by mutation, not assumed — that exact mutation survived the whole JS suite.
