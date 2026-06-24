# Changelog

All notable changes to junoui are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/); the package follows
[semantic versioning](https://semver.org/). Tokens are the public contract: a
changed token value or removed token is a breaking change.

## [Unreleased]

### Added

- DTCG token source (`tokens/`): color (3 palettes × dark/light), spacing,
  radius, border, sizing, typography.
- Style Dictionary build → CSS, SCSS, JS/TS, JSON, Android, iOS, Flutter.
- Dependency-free OKLCH → sRGB hex conversion for native/Flutter outputs.
- Framework-agnostic CSS layer: base, utilities, and components (badge, button,
  card, readout, status dot, loaders) driven by a single `--juno-role` property.
- Loaders — arc, beacon, linear bar; each indeterminate (CSS-only) and
  determinate (driven by `--juno-progress`).
- Responsive layout layer: breakpoint tokens (Tailwind scale) + intrinsic
  primitives (`stack`, `cluster`, `grid-auto`, `sidebar`, `switcher`, `reel`,
  `center`) + container-query reflow on cards.
- npm packaging with `exports` for every platform; `prepare` builds `dist/`.
- Docs: getting-started, web, native, flutter, design-guidelines, generated
  token reference, and per-component specs.
- Interactive `showcase/` demo (repo-only; excluded from the package).
- CI: build, dist verification, token-reference drift check, publish on tag.

## [0.1.0] — unreleased

- Initial design-system module.
