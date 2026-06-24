# Native mobile (Android / iOS)

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

## Keeping in sync

Re-run `npm run build` in junoui and re-copy the files (or script the copy in your
CI). Because all platforms derive from the same `tokens/` source, the values can
never drift between web and native.

Exact values for every token: [tokens-reference.md](./tokens-reference.md).
