---
'@junoput01/junoui': minor
---

**Rust token target — `junoui/rust`.**

junoui compiles one DTCG source to CSS, SCSS, JS, Android XML, iOS Swift, Flutter Dart and DTCG JSON. Rust was the one mainstream native target missing, so a Rust consumer had to hand-transcribe hex values — which drift silently on the first patch release, with no lint to catch the stale copy. That is the mirrored-constant defect; this removes the reason to commit it.

`dist/rust/juno_tokens.rs` (exported as `junoui/rust`) is a dependency-free const module for any native Rust stack — egui, iced, Slint, Bevy, Dioxus desktop, Tauri's Rust side:

```rust
let bg = STANDARD_DARK.s0.to_f32_array();   // a whole theme, picked at runtime
let accent = STANDARD_DARK_ACTIVE;          // or one role, flat
let gap = SPACE_16;                         // f32 px
let fade = MOTION_DURATION_BASE_MS;         // f32 milliseconds
```

Colors become an `Rgba` struct with `const fn hex()`, `to_f32_array()` and `with_alpha()`; core tokens are bucketed by the **form** of their value rather than by which file they came from — `px` → `f32`, `ms` → `f32` suffixed `_MS`, whole numbers → `i32`, ratios → `f32`, and CSS-authored strings (shadows, font stacks) shipped verbatim as `&str`.

Beyond the flat constants the Swift and Dart targets ship, there is a `Palette` struct and one const per palette/mode, because a Rust app picks a theme at runtime and wants a value it can pass around. Its fields and the constants that fill it both come from junoui's role list, so a role cannot reach one and miss the other.

`to_f32_array()` is sRGB-encoded, not linear — convert at your boundary if your pipeline wants linear.

Additive: no existing output changes.
