---
'@junoput01/junoui': minor
---

**Geospatial and 3D-viewport icons — the sprite goes from 66 to 80 symbols.**

The 0.7.0 sprite covered media, files, system and status with **zero spatial vocabulary**: no crosshair, no ruler, no polygon, no map pin, no globe, no layers stack, no compass, no cube. Every map, GIS, CAD or 3D consumer therefore sourced icons elsewhere — and the moment they did, half the UI stopped matching Phosphor bold, which is the cohesion junoui exists to provide.

Added, all Phosphor bold so the set stays one family and one licence: `crosshair`, `crosshair-simple`, `ruler`, `polygon`, `path`, `map-pin`, `map-trifold`, `stack`, `globe`, `mountains`, `cube`, `compass`, `scissors`, `selection`.

Nothing new is needed to use them — the `.juno-icon` sizing and colour contract is unchanged, and the existing subset tooling covers them. The showcase gallery renders from the sprite, so they appear there automatically.

`test/icons-family.test.mjs` now enforces the property the ticket actually cares about, which is cohesion rather than inventory: one `0 0 256 256` canvas for every symbol, colour inherited through `currentColor`, no `<style>` blocks, classes or external references, no empty symbols, the sprite and `src/icons/` agreeing in both directions, and the MIT licence travelling with the glyphs. A test that only counted symbols would pass with a Material crosshair dropped in beside Phosphor's.
