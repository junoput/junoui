# Field

Wraps any control with a label, optional help text, and an error message. Pure
layout + the validation/required cue — it owns no state.

## Web

```html
<div class="juno-field">
  <label class="juno-field__label" for="cs">
    Callsign <span class="juno-field__req" aria-hidden="true">*</span>
  </label>
  <input id="cs" class="juno-input juno-mono" type="text" aria-required="true" />
  <span class="juno-field__help">ICAO format</span>
</div>

<!-- error -->
<div class="juno-field">
  <label class="juno-field__label" for="sq">Squawk</label>
  <input id="sq" class="juno-input juno-mono" aria-invalid="true" aria-describedby="sq-e" />
  <span class="juno-field__error" id="sq-e">Emergency squawk detected</span>
</div>
```

| Class                | Effect                                                                  |
| -------------------- | ----------------------------------------------------------------------- |
| `.juno-field`        | Vertical stack (label · control · help/error), `space.4` gap.           |
| `.juno-field__label` | 10px uppercase, tracking `wider`, `label` color.                        |
| `.juno-field__req`   | Required asterisk in `warning`. Decorative — pair with `aria-required`. |
| `.juno-field__help`  | 11px `label` helper text.                                               |
| `.juno-field__error` | 11px `warning` error text.                                              |

## Anatomy (any platform)

- Stack label → control → message; gap `space.4`.
- Label: B612, `font.size.10`, uppercase, tracking `font.tracking.wider`, `label` color.
- Help `font.size.11` `label`; error `font.size.11` `warning`.

## Usage

- One control per field. Tie `for`/`id`, and `aria-describedby` to the help/error id.
- For errors, set `aria-invalid="true"` on the control (it re-colors its own border)
  **and** show `.juno-field__error`. The asterisk is visual; required-ness is
  `aria-required` on the control.
