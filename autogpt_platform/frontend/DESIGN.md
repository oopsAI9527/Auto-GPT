# Design guide

How to build and change UI in `autogpt_platform/frontend`. Read this before you write or edit any component, page or style.

This page says what to reach for. The rules behind it, and the lint rule that enforces each one, are in [`docs/engineering/design-system.md`](../../docs/engineering/design-system.md). When the two disagree, that page and `pnpm lint` win; fix this one in the same pull request.

## The one idea

Every design value lives in a token file. Components name a token; they never write a value. Change a token file and the whole app follows.

| File                            | Holds                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------- |
| `src/app/tokens/theme.css`      | Every colour, as a role (`--color-surface`, `--color-foreground-body`)                            |
| `src/app/tokens/typography.css` | Text sizes and their line heights                                                                 |
| `src/app/tokens/shape.css`      | Corner radii, shadows, stacking layers, the app shell's sizes                                     |
| `src/app/tokens/motion.css`     | Durations and easings (`src/components/styles/motion.ts` holds the same values for Framer Motion) |

So in a component you never write a hex or `rgb()` colour, a pixel radius, a `shadow-[…]`, a `z-50`, a cubic-bezier, or a font size. If the token you need does not exist, add it (see [Adding a token](#adding-a-token)); do not write the value at the call site.

## Colour: pick the role by what the thing is

Use a role with any colour utility, opacity included: `bg-surface`, `text-foreground-secondary`, `border-border-base`, `bg-orange/10`. In a string that needs a colour, write `rgb(var(--color-<role>))`.

| You are colouring                                                               | Use                                                                                                                  |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| The page behind everything                                                      | `canvas`                                                                                                             |
| A card, panel, input, menu                                                      | `surface`, then `surface-muted`, `surface-hover`, `surface-active`                                                   |
| A backdrop behind a dialog; a veil over an image                                | `scrim`, `overlay`                                                                                                   |
| Text and icons, strongest to weakest                                            | `foreground-base`, `-strong`, `-emphasis`, `-body`, `-secondary`, `-tertiary`, `-subtle`, `-disabled`; `placeholder` |
| A divider, a border, a focus ring                                               | `separator`, `border-base`, `border-strong`, `focus`                                                                 |
| The primary button, a checked or selected marker, a progress fill               | `action`, `action-hover`, with `action-foreground` on it                                                             |
| An always-dark surface that shows content: toast, tooltip, terminal, code block | `surface-inverse`, `surface-inverse-hover`, with `foreground-inverse` on it                                          |
| Text or an icon on a saturated fill (brand, a status, an accent)                | `foreground-on-color`                                                                                                |
| A grey dot, bar, track, tick or tile                                            | `fill-subtle`, `fill-soft`, `fill-medium`, `fill-bold`, `fill-strong`                                                |
| The brand purple                                                                | `brand`, `brand-hover`, `accent-surface`, `accent-strong`                                                            |
| A status                                                                        | `error`, `warning`, `success`, `info`, each with `-foreground` and `-surface` (`warning-border`, `error-hover` too)  |
| A category, meter or data hue that is not a status                              | `orange`, `yellow`, `sky`, `indigo`, `pink` (a tint is the hue at an opacity: `bg-pink/10`)                          |
| The app sidebar                                                                 | `shell`, `shell-foreground`, `shell-hover`, `shell-active`, `shell-border`                                           |
| The flow editor                                                                 | `builder-canvas`, `builder-grid`, `node-surface`, `node-border`, `node-selected`, `edge`, `handle`                   |

Three mistakes to avoid, because they break the day a look changes one role:

- **A text role as a fill.** `bg-foreground-subtle` on a dot is wrong; use `bg-fill-subtle`.
- **`action` as "the dark surface".** A toast is not a button; use `surface-inverse`.
- **`action-foreground` as "white".** On `bg-brand` or `bg-error`, use `foreground-on-color`.

Artwork, logos, chart series and colours a person picks are the only colours outside the roles. They are listed, with a reason, in `ds-colour-exempt.json`; never use a suppression comment for a colour.

## Text

All copy goes through the `Text` atom. The `variant` is the role; everything else is a prop.

- **Variants:** `hero`, `h1`, `h2`, `h3`, `h4`, `h5`, `heading-md`, `lead`, `large`, `body-md`, `body`, `body-sm`, `small`, `caption-sm`, `tiny`, `label`, `eyebrow`.
- **Props:** `tone` (colour), `weight` (`normal`, `medium`, `semibold`, `bold`), `leading`, `tracking`, `mono`, `tabular`, `italic`, `decoration`, `transform`, `align`, `narrowSize` (a larger size on narrow screens), and `as` for the tag.
- **Tones** come from `src/components/styles/tones.ts`: `base`, `primary`, `emphasis`, `body`, `secondary`, `muted`, `subtle`, `disabled`, `inverse`, `on-color`, `brand`, `accent`, `danger`, `error`, `warning`, `success`, `info`, `inherit`, and a few stronger or lighter steps of those.

```tsx
<Text variant="small" weight="medium" tone="secondary">
  Last run 2h ago
</Text>
```

`className` on `Text` is for layout, truncation, line clamping, wrapping and alignment only. Never a size (`text-sm`, `text-[13px]`), a weight class or a colour class.

## Buttons

Use the `Button` atom and choose four things:

- **`variant`**, the role: `primary`, `secondary`, `outline`, `ghost`, `destructive`, `link`, `icon`, and the rarer `toggle`, `floating`, `tray`, `brand`, `warning`, `success`. The `compact-*` variants and sizes are an older family; do not use them in new code.
- **`size`:** `large` (default), `small`, `xs`, `row`, `inline`, `inline-xs`, and `icon`, `icon-sm`, `icon-xs`, `icon-2xs` for an icon alone.
- **`shape`**, the corner: `pill` (default), `rounded`, `soft`, `sharp`. Shape is the only place a button gets its radius.
- **`tone`**, for a quiet ghost: `quiet`, `quiet-subtle`, `quiet-danger`, `quiet-warning`, `quiet-info`, `quiet-remove`.

`className` on a `Button` is layout only.

## Icons

Hugeicons only, through the `Icon` atom: `<Icon icon={Delete02Icon} size={16} tone="muted" />`. `tone` takes the same values as `Text`; without one the icon takes the colour around it. `spin` for a loader.

## Shape: radius

Use a step: `rounded-sm` (4px), `rounded-md` (6), `rounded-lg` (8), `rounded-xl` (12), `rounded-2xl` (16), `rounded-3xl` (24), `rounded-4xl` (32), `rounded-5xl` (40). Never `rounded-[…]`.

**Pill or circle.** Ask: in a look where controls have 8px corners, should this become 8px?

- Yes: it is a **pill**. Use `rounded-pill`. Buttons, icon buttons, chips, badges, tags, tabs, search fields, tracks of a progress bar or switch.
- No, it is round by nature: it is a **circle**. Use `rounded-full`. Avatars, status dots, spinners, the thumb of a switch, radio marks, count bubbles sized square.

## Depth: shadows

Use a named step from `shape.css`. Never write a shadow by hand.

| Need                                             | Class                                                |
| ------------------------------------------------ | ---------------------------------------------------- |
| A resting card or field                          | `shadow-sm`, `shadow-subtle`                         |
| A menu, popover, dropdown                        | `shadow-md`, `shadow-lg`, `shadow-popover-raised`    |
| A dialog or sheet                                | `shadow-xl`, `shadow-2xl`                            |
| A card that lifts on hover                       | `shadow-lift`                                        |
| Something floating over the page                 | `shadow-drop`                                        |
| A keyboard key                                   | `shadow-keycap`                                      |
| A glossy chip or bar                             | `shadow-gloss`, `shadow-sheen`                       |
| A 1px outline drawn as a shadow; a selected halo | `shadow-outline`, `shadow-halo`                      |
| A coloured glow                                  | `shadow-glow`, `shadow-status-glow`, `shadow-beacon` |

To tint a shadow, add a colour class beside the step: `shadow-drop shadow-brand/45`.

## Stacking: layers

Use a named layer, lowest first. Never `z-10`, `z-[60]` or `zIndex: 5`.

`z-behind` · `z-base` · `z-raised` (lifted over a sibling) · `z-sticky` (bars pinned in a pane) · `z-floating` (a button over a pane) · `z-header` · `z-overlay` (dialogs, sheets, menus, popovers, tooltips) · `z-drawer-scrim` · `z-drawer` · `z-command` (the command palette) · `z-blocking` (must cover everything) · `z-tour-scrim` · `z-tour`

If nothing fits, add a layer to `shape.css` with a name that says what it is.

## Motion

- **In CSS:** `duration-instant` (100ms), `duration-fast` (150), `duration-base` (200), `duration-slow` (300), `duration-slower` (400), `duration-slowest` (500); `ease-standard`, `ease-out`, `ease-in`, `ease-emphasized`, `ease-drawer`.
- **In Framer Motion:** import from `@/components/styles/motion`.

```tsx
import { duration, ease, spring } from "@/components/styles/motion";

<motion.div transition={{ duration: duration.base, ease: ease.out }} />
<motion.div transition={{ type: "spring", ...spring.snappy }} />
```

No cubic-bezier arrays, no `"easeOut"` strings, no local `EASE` constants; a test fails them. Endless ambient loops and durations of 0.6s or longer may keep their own numbers.

Reduced motion is handled once at the app root (`MotionConfig reducedMotion="user"`): Framer drops movement and keeps fades. Add your own branch only when an animation needs more than that.

## Primitives own their look

`src/components/{atoms,molecules,organisms}` decide how they look. At a call site you pick a `variant`, `size`, `tone` or `shape`; `className` is for layout: width, flex and grid placement, margin, position.

- Search `src/components` and Storybook before building something new.
- If you are about to restyle a primitive with classes, look for a prop first.
- If the same treatment appears a second time, make it a prop on the primitive, with static class strings and a name that says its purpose. Do not copy a class string between call sites.
- Never build a class from a variable (`` `bg-${tone}` ``); map the prop to whole class names.
- No inline `style` for a fixed value. A value known only at runtime goes through a CSS custom property and a class: `style={{ "--w": width }}` with `w-(--w)`.

## Themes and looks

The app is light only today. Two attributes on `<html>` are reserved so that this can change without touching components:

- `data-theme` is the mode, `light` or `dark`. It means nothing else.
- `data-look` is the look, a second set of token values. The only one that exists is `canary`, a development tool.

Never write a `dark:` or `light:` class; they never render. A theme is a file of token values, not a second set of classes. How to add one is in `docs/engineering/design-system.md`.

## Before you say it is done

1. `pnpm format`, `pnpm lint`, `pnpm types`. The `design-system/*` rules run inside `pnpm lint`, and each error names the token or prop to use.
2. Never raise a count in `scripts/eslint-rules/design-system-baseline.json`, and never add a suppression to get past a rule. If you removed violations, run `pnpm lint:ds-baseline` and commit the lower counts.
3. If you touched a token file or a primitive, prove the pipeline still holds: build Storybook, then run `npx tsx scripts/ds/canary-check.ts --storybook-url <url>`. It renders every story in the default and the canary look and lists any colour, radius or font that did not follow the tokens. Your change should add none.
4. For a change to `src/components/**`, `globals.css` or a token file, attach before and after screenshots at 1440 and 390 px to the pull request, or write "no pixel change" and how you checked.

## Adding a token

Add one only when real, repeated uses need a value no token has.

1. Write the value in the token file (`theme.css` for a colour, as an RGB triplet; `shape.css` or `motion.css` otherwise).
2. Register the name in `src/app/globals.css` so Tailwind makes a class for it. Shadows are registered in `shape.css` itself.
3. For a colour, list it in `src/components/styles/color-roles.ts`. For a motion value, add it to `src/components/styles/motion.ts`.
4. For a colour, a radius or a text size, give it a value in `src/app/tokens/themes/canary.css`.
5. Run the token tests: `pnpm vitest run src/components/__tests__ src/components/styles`. They fail a token that is not registered, not listed or not in the canary.
