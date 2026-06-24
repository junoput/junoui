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

## Theming

Map the active palette/mode to a helper that returns the right constant, or build a
`ThemeExtension` keyed on palette+mode. All constants derive from the same source,
so they stay in lockstep with web and native.

Exact values for every token: [tokens-reference.md](./tokens-reference.md).
