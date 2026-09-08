# Flutter

Colors are pre-converted to sRGB hex at build time (Dart has no `oklch`).

## Add the file

Copy the generated file into your project:

```
dist/flutter/juno_tokens.dart   →  lib/theme/juno_tokens.dart
```

## Use it

```dart
import 'theme/juno_tokens.dart';

Container(
  color: JunoTokens.standardDarkS1,
  padding: const EdgeInsets.all(JunoTokens.space16),
  child: Text(
    '89.3',
    style: TextStyle(
      color: JunoTokens.standardDarkNominal,
      fontSize: JunoTokens.fontSize38,
      fontFamily: 'B612 Mono',
    ),
  ),
)
```

- Colors are `Color` constants named `<palette><Mode><Role>` (camelCase),
  fully opaque (`0xFF…`).
- Dimensions are `double` constants (`space16`, `fontSize14`, `radius8`, …).

**Scope, decided (20260908-083):** Dart carries every core token junoui
has, in the form its value implies — lengths as `double`, durations as
`double` milliseconds (`…Ms` suffix), the z-index scale and font weights
as `int`, opacity/line-height/ratios as `double`, and anything else
(shadows, easing curves, font-family strings) as `String` verbatim, for
you to interpret at your own boundary — the same contract Rust
(`docs/native.md#rust`) already has. An earlier build filtered core
tokens to lengths only, so motion durations, the z-index scale, opacity,
font weights, line-height and the canvas scrim never reached Dart. That
was never a stated scope, just an emitter narrower than the token set it
was meant to cover — fixed rather than left undocumented.

```dart
final fade = JunoTokens.motionDurationBaseMs; // double, ms
final z = JunoTokens.zRaised;                 // int
final dim = JunoTokens.opacityDisabled;       // double, 0..1
```

## Theming

Map the active palette/mode to a helper that returns the right constant, or build a
`ThemeExtension` keyed on palette+mode. All constants derive from the same source,
so they stay in lockstep with web and native.

Exact values for every token: [tokens-reference.md](./tokens-reference.md).
