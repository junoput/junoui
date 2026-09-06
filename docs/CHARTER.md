# junoui charter

What this project is for, what it will not do, and how a request against it is
decided. Written so that an accept or a refuse can cite a line rather than a
preference.

Companion documents: [CLAUDE.md](../CLAUDE.md) carries the hard rules for
editing the repo; [roadmap.md](./roadmap.md) carries what is planned;
[design-guidelines.md](./design-guidelines.md) and [painted-ui.md](./painted-ui.md)
carry the principles the components are built against. This file carries the
boundary.

## What junoui is

A **design system and UI foundation**. Tokens authored once and compiled to
every platform, plus a framework-agnostic CSS component and layout layer.

It dresses skeletons built elsewhere. It ships the look and the accessibility
contract; the behaviour stays in the consumer.

## What junoui is for

1. **One source of truth for design values.** A colour, a space step, a radius,
   a breakpoint, a motion duration is authored in `tokens/**` and emitted to
   CSS, SCSS, JS, JSON, Android, iOS, Flutter and Rust. A consumer that
   hardcodes one of those has found a bug in this project, not a shortcut.
2. **Components that render with zero JavaScript.** Every component is CSS over
   markup. Optional enhancers exist and are stateless.
3. **Rules a consumer would otherwise re-derive.** Where a layout decision has
   one defensible answer given the tokens — is this pointer coarse, does
   compact navigation apply, how wide is a halo at this type size — junoui
   emits the answer as a function rather than leaving each consumer to
   rediscover it. This is why `dist/rust/juno_rules.rs` exists.
4. **A contract that survives the trip to a non-browser platform.** An Android,
   iOS, Flutter or Rust consumer gets the same values as a web consumer, from
   the same build.

## The four boundaries

These are the lines a request gets measured against. They are not
preferences; each one has a cost attached that has already been paid at least
once.

### 1. Presentational only — no state, no data, no business logic

junoui does not ship stateful widgets. No chat logic, no calendar arithmetic,
no data fetching, no focus traps, no routers, no form validation.

The test: **does it render correctly with JavaScript disabled?** If the answer
depends on runtime state the component owns, it is out of scope.

Where it goes instead: the consuming app, or a sibling `junoui-<framework>`
package that may depend on junoui and hold the behaviour.

Why the line is here: a design system that owns state stops being adoptable by
anyone whose state lives elsewhere, which is everyone.

### 2. Values live in tokens; components never hardcode a role colour

A component reads `var(--juno-role)`. A `.juno--<role>` class sets it. A
component that hardcodes a role colour has moved a design decision out of the
token layer, where every platform can see it, into a stylesheet, where only the
web can.

Corollary that has bitten: a token's classification must follow the token's own
declaration, not a naming coincidence. Ninety colours agreed with a
path-prefix classifier until the first group that did not, and an entire
platform silently lost seven colours (`20260906-056`).

### 3. Tokens are a published contract

Changing or removing a token is a breaking change. Adding one is a minor.
Consumers vendor these outputs and generate code from them; a value that moves
without a note is a value that moves silently in somebody's contrast
calculation.

This is why a token-value diff is a legitimate thing to ask junoui for, and
why the answer is measured rather than recalled.

### 4. Namespace and platform neutrality

Everything is `juno`-prefixed: `--juno-*`, `.juno-*`, `JunoTokens`,
`data-juno-*`. Nothing is named for a consumer, and no consumer's vocabulary
enters the token tree because that consumer asked. See routing below.

## What junoui refuses, and what it offers instead

| Request                                                       | Answer              | Instead                                                                          |
| ------------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------- |
| A stateful component (calendar, chat, combobox behaviour)     | Refuse — boundary 1 | The CSS shell here; the behaviour in the app or `junoui-<framework>`             |
| A component that fetches or formats domain data               | Refuse — boundary 1 | Tokens and layout primitives; the app supplies content                           |
| A framework binding (React/Vue/Svelte components)             | Refuse — scope      | A sibling package that depends on junoui                                         |
| A token named for one consumer's domain concept               | Refuse — boundary 4 | A token named for the visual property, if the property generalises               |
| A hardcoded colour "just for this component"                  | Refuse — boundary 2 | A role, or a new token if the value is genuinely new                             |
| A breaking token change without a major                       | Refuse — boundary 3 | The change, in a major, with a migration line                                    |
| A value that varies by the consumer's data, not by the design | Refuse — see below  | The consumer owns it; junoui may document that it deliberately does not model it |

## The test for "is this vocabulary ours?"

The recurring hard question is not whether a value is right — it is whether
the **concept** belongs in a shared design system at all. The test:

> **Does the quantity vary with something junoui can see?**

junoui can see type size, pointer coarseness, viewport and container geometry,
density mode, role, and theme. It cannot see how many features a consumer is
drawing, how dense their data is, what their zoom level means, or what their
domain calls things.

- A halo that widens at display type sizes varies with **type size** — junoui
  can see that. It is ours.
- A casing that narrows because a dense road network would turn to mush varies
  with **feature density** — junoui cannot see that, and has no defensible
  default for it. It is the consumer's.

A quantity junoui cannot see gets a documented refusal, not a token with an
arbitrary default. **A default nobody can derive is worse than an absent
token**, because it looks authoritative and every consumer inherits a number
that was picked rather than reasoned.

When refusing on this ground, say so in the consumer-facing docs, so the next
consumer does not re-ask. Silence reads as an oversight; a stated refusal reads
as a decision.

## Routing — where a request goes

- **A value that generalises across consumers** → a token, minor release.
- **A layout decision with one defensible answer given the tokens** → a rule in
  the rules module, emitted to every platform.
- **A visual pattern with no state** → a component.
- **Behaviour, state, or data** → out of scope; the consumer or a sibling
  package.
- **A quantity junoui cannot see** → documented non-goal.

## What is outside this charter entirely — operator-tier

The sub-orchestrator does not decide these. They go up.

- **Publishing to npm.** Every release is operator-gated.
- **Repository settings and CI configuration** — anything under `.github/`.
- **Promotion to `main`.**
- **Anything that leaves this box.**

## What a green here means, and does not

junoui's gate is Linux and llvmpipe. Local results are the standard by operator
decision. That is a statement about **what blocks a merge**, not a claim that
macOS, iOS Safari, or wasm is covered.

Rendered frames establish **geometry**. They say nothing about colour, weight
or balance — those are the operator's call, not a rendered image's.

One class of claim cannot be settled here at all: real-device browser
behaviour. `20260803-034` is open precisely because the box cannot produce an
iOS 26 device, and the honest status is _instrument ready, waiting on a
reading_ rather than _verified_.

## What this charter does not settle

Stated so nobody reads more coverage into it than it has:

- **It does not rank the roadmap.** What junoui _should_ build next is
  [roadmap.md](./roadmap.md); this file only says what junoui _may_ build.
- **It does not define the principles the components are designed against.**
  That is design-guidelines.md and painted-ui.md, and there are known gaps in
  both around layout hierarchy and disclosure.
- **It does not cover the showcase or `design/`.** Neither ships in the
  package.
- **It has no opinion on how a consumer structures its app.** junoui provides
  primitives and refuses to imply an architecture.
