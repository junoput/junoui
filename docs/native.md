# Native (Android / iOS / Rust)

Native platforms can't parse `oklch()`, so colors are pre-converted to sRGB hex
during the build. Values match the web rendering.

## Android

Copy or sync the generated resources into your module:

```
dist/android/colors.xml   →  res/values/colors.xml
dist/android/dimens.xml   →  res/values/dimens.xml
```

Reference them:

```xml
<TextView
    android:textColor="@color/standard_dark_nominal"
    android:padding="@dimen/space_16"
    android:textSize="@dimen/font_size_14" />
```

- Color names: `<palette>_<mode>_<role>` (e.g. `colorblind_dark_warning`).
- Dimensions are `dp`; font sizes are `sp`.
- Theme switching: pick the resource set for the active palette/mode, or split the
  files into qualified `values-night/` for dark mode.

## iOS (Swift)

Add the generated file to your target:

```
dist/ios/JunoTokens.swift
```

```swift
label.textColor = JunoTokens.standardDarkNominal
let pad: CGFloat = JunoTokens.space16
let body: CGFloat = JunoTokens.fontSize14
```

- Colors are `UIColor` constants named `<palette><Mode><Role>` (camelCase).
- Dimensions are `CGFloat` constants.

## Rust

Any native Rust stack — egui, iced, Slint, Bevy, Dioxus desktop, Tauri's Rust
side. Vendor `dist/rust/juno_tokens.rs` into your crate, or add junoui as a
build dependency and copy it in `build.rs`.

```rust
include!(concat!(env!("OUT_DIR"), "/juno_tokens.rs")); // or `mod juno_tokens;`

let bg = STANDARD_DARK.s0.to_f32_array();   // a whole theme, picked at runtime
let accent = STANDARD_DARK_ACTIVE;          // or one role, flat
let gap = SPACE_16;                         // f32 px
let fade = MOTION_DURATION_BASE_MS;         // f32 milliseconds
```

| Emitted as                                         | From                                                 |
| -------------------------------------------------- | ---------------------------------------------------- |
| `Rgba` (`hex()`, `to_f32_array()`, `with_alpha()`) | every color token                                    |
| `Palette` + one const per palette/mode             | the same colors, grouped                             |
| `f32`                                              | `px` lengths                                         |
| `f32`, suffixed `_MS`                              | `ms` durations                                       |
| `i32`                                              | whole numbers (z-index, font weight)                 |
| `f32`                                              | ratios (opacity, line height)                        |
| `&str`                                             | CSS-authored values, verbatim (shadows, font stacks) |

**`to_f32_array()` is sRGB-encoded, not linear.** If your pipeline wants linear
(wgpu with a non-sRGB surface format), convert at your boundary — junoui cannot
know which surface you created.

**Shadows and font stacks are shipped unparsed.** A Rust renderer cannot consume
`0 4px 14px rgb(0 0 0 / 0.35)` directly; they are here so the values live in one
place, not as ready-made native input.

**Do not transcribe these values into your own crate.** That copy is exactly
what this target exists to stop — it goes stale on the first patch release and
no lint catches it.

## Keeping in sync

Re-run `npm run build` in junoui and re-copy the files (or script the copy in your
CI). Because all platforms derive from the same `tokens/` source, the values can
never drift between web and native.

Exact values for every token: [tokens-reference.md](./tokens-reference.md).
