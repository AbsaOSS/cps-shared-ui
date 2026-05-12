---
name: code-examples-generator
description: >
  Generates `.examples.ts` files for cps-shared-ui composition pages. Use this skill
  whenever someone asks to add code examples, create an examples file, generate
  examples.ts, wire up CodeExampleComponent for a new component page, or populate
  HTML/TS code strings for composition previews. Triggers on phrases like "generate
  examples for X component", "add code examples to Y page", "create examples.ts for Z",
  or "wire up the code preview for W". Always use this skill — not general knowledge —
  when working on cps-shared-ui example generation tasks.
---

# Code Examples Generator

Generates `<component>-page.examples.ts` files for the `cps-shared-ui` composition app.
These files hold the HTML and TypeScript code strings shown in the `CodeExampleComponent`
(Preview / HTML / TS tab switcher) introduced in PR #554.

## Context

The composition app lives at `projects/composition/src/app/pages/<component>-page/`.
Each component page has three files:

- `<component>-page.component.ts` — Angular component, imports `CodeExampleComponent`, exposes `examples`
- `<component>-page.component.html` — Template, wraps each preview in `<app-code-example>`
- `<component>-page.examples.ts` — **Your output**: typed object with `html` and `ts` strings per example

The `CodeExampleComponent` accepts:

```html
<app-code-example
  label="Example label"
  [htmlCode]="examples.someExample.html"
  [tsCode]="examples.someExample.ts">
  <!-- live preview content here -->
</app-code-example>
```

## Your Job

Given:

- The page's **HTML template** (to discover the live preview blocks)
- The page's **TypeScript component** (to discover reactive state, signals, options arrays, etc.)

Produce a complete `<component>-page.examples.ts` that:

1. Exports a **single const object** (e.g. `export const buttonExamples = { ... }`)
2. Has one key per `<app-code-example>` block (camelCase, matching the `label`)
3. Each key maps to `{ html?: string, ts?: string }` — at least one of the two must be present; omit whichever is not needed
4. The `html` string is a **faithful, minimal reproduction** of that preview block — stripped of the outer `<app-code-example>` wrapper, with all `cps-*` component attributes and Angular syntax preserved exactly, but composition-only layout wrapper elements removed (see Strict Rules)
5. The `ts` string shows only what is **relevant to that example**: signal/property declarations, option arrays, event handlers — nothing unrelated to the example, and never imports

## Step-by-Step Process

### 1. Read the inputs

Ask the user to paste (or point to) the following files for the component being wired up:

- `<component>-page.component.html`
- `<component>-page.component.ts`

If both are available in context already, proceed without asking.

Then scan a few existing `*.examples.ts` files from other component pages under
`projects/composition/src/app/pages/` to calibrate:

- The level of detail expected in `html` and `ts` strings for similar patterns
  (e.g. option arrays, event handlers, disabled states, multi-variant sections)
- How section comments (`<!-- large -->`, `<!-- small -->`) are used in practice
- Any recurring shared-const patterns (factored `ts` strings reused across entries)

Use these as a style reference, not a template to copy. The goal is consistency
with the rest of the codebase, not uniformity.

### 2. Identify examples

**If the template already contains `<app-code-example>` blocks** (already migrated):

- Note the `label` input value → this becomes the camelCase key
- Extract the inner content (the live preview markup) → this becomes the `html` string

**If the template has no `<app-code-example>` blocks** (pre-migration — initial wiring):

Identify example boundaries by looking for natural groupings in the template. Treat each of the following as a separate example:

- A discrete preview section separated by a heading, comment, or `<hr>`
- A self-contained component usage block with its own set of inputs/bindings that differ meaningfully from its neighbours
- Any block the page's `.ts` file describes separately (e.g. distinct signal declarations, separate option arrays)

For each identified block:

- Infer a short, human-readable label from its heading or the variant it demonstrates (e.g. `"Primary button"`, `"Disabled state"`)
- Treat the raw markup of that block as the `html` string
- You will wrap it in `<app-code-example>` in Step B after generating the examples file

### 3. Extract relevant TS per example

For each example, identify which TypeScript pieces are used by that example's HTML:

- Signal/property declarations (`myProp = signal(...)`, `options = [...]`)
- Methods/event handlers called in the template (`onSelect(...)`, `onChange(...)`)
- Any reactive computation relevant to the example

Do **not** include:

- Imports (readers can figure those out from the component; they clutter the snippet)
- Lifecycle hooks unless they directly set up something used in this specific example
- Component-level boilerplate (`@Component`, `host`, `constructor`) — only include constructor logic if it directly initialises something used in this example
- Properties/signals used only in _other_ examples

### 4. Format the output

Follow the project's Prettier config: **single quotes, semicolons, no trailing commas, 80-char print width, 2-space indent.**

```typescript
// <component>-page.examples.ts

export const <component>Examples: Record<string, { html?: string; ts?: string }> = {
  exampleOneLabel: {
    html: `
<cps-some-component
  [someInput]="value"
  (someEvent)="handler($event)">
</cps-some-component>`,
    ts: `
someValue = 'hello';
handler(event: SomeType) {
  // ...
}`
  },

  exampleTwoLabel: {
    html: `...`
  }
};
```

## Strict Rules (never break these)

| Rule                                                                                                              | Why                                                                         |
| ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **Preserve component markup exactly** — copy every attribute, binding, directive, and event handler of `cps-*` elements without paraphrasing or reordering | Users copy these snippets; any change breaks their code |
| **Strip composition-only layout wrappers** — omit outer `<div>` elements whose sole purpose is page layout and whose class is defined only in the page's `.scss` file (e.g. `.checkboxes-group`); keep structural wrappers that are semantically part of the example (e.g. a div that displays a bound value) | Those classes don't exist outside the composition app and mislead consumers |
| **Add section comments for multi-variant examples** — when one example contains multiple size or style variants, label each group with an HTML comment (e.g. `<!-- large -->`, `<!-- small -->`) as in the existing button examples | Helps consumers scan the snippet without running it |
| **Preserve Angular syntax exactly** — `[input]`, `(event)`, `*ngIf`, `@if`, signal calls `()`, etc.               | Angular is strict about template syntax                                     |
| **No hallucinated properties** — only include TS properties you actually see used in that specific example's HTML | Hallucinated props compile-error or mislead users                           |
| **No invented imports** — never add import statements to the `ts` string                                          | They vary by project setup and add noise                                    |
| **One object export per file** — don't split into multiple exports or use `default export`                        | The component imports it as `import { xExamples } from './x-page.examples'` |
| **Preserve indentation style** — if the project uses 2-space indent, keep it                                      | Consistency with the codebase                                               |
| **Omit unused keys** — omit `html` when the example has no template, omit `ts` when it needs no TypeScript; at least one must be present | Omitting is cleaner than empty strings; `CodeExampleComponent` handles absence gracefully |

## Example Output (Button)

```typescript
// button-page.examples.ts

export const buttonExamples: Record<string, { html?: string; ts?: string }> = {
  primaryButton: {
    html: `
<cps-button label="Click me" (clicked)="onButtonClick()"></cps-button>`,
    ts: `
onButtonClick() {
  console.log('Button clicked');
}`
  },

  disabledButton: {
    html: `
<cps-button label="Disabled" [disabled]="true"></cps-button>`
  },

  buttonWithIcon: {
    html: `
<cps-button label="Download" icon="arrow-down-to-line"></cps-button>`
  }
};
```

## After generating examples.ts

Immediately apply the two integration steps — do not just describe them.

### Step A — Update `<component>-page.component.ts`

1. Add `CodeExampleComponent` to the `imports` array (already imported from `'../../components/code-example/code-example.component'`)
2. Add the examples import and expose it as a readonly class property

```typescript
import { CodeExampleComponent } from '../../components/code-example/code-example.component';
import { componentExamples } from './<component>-page.examples';

// inside @Component:
imports: [..., CodeExampleComponent],

// inside class:
readonly examples = componentExamples;
```

### Step B — Update `<component>-page.component.html`

Wrap each live preview block in `<app-code-example>`. The `label` must match the key used in the examples object (human-readable form). Bind `[htmlCode]` and `[tsCode]` only for entries that have the corresponding key; omit bindings for absent keys.

```html
<app-code-example
  label="Primary button"
  [htmlCode]="examples.primaryButton.html"
  [tsCode]="examples.primaryButton.ts">
  <!-- existing preview markup stays here unchanged -->
</app-code-example>
```

### Step C — Run lint

After all three files are written, run:

```bash
npm run lint -- --fix
```

If any errors remain that `--fix` cannot resolve, fix them manually before confirming the task is done.

## Handling Ambiguity

- **Signal vs property unclear?** Default to property syntax in the `ts` string; it's safe for both
- **Multiple examples share the same TS setup?** Extract it into a local `const` at the top of the file and reference it in each entry — e.g. `const citiesOptionsTs = \`options = [...]\`;` then `ts: citiesOptionsTs`. Duplication is fine when setups differ; factoring is preferred when they are identical.
- **Template uses `@if` / `@for` control flow?** Include in `html` verbatim; do NOT convert to `*ngIf`/`*ngFor`
- **Example uses a service injected in constructor?** Show the injection in the `ts` string as a comment: `// inject(MyService) used here`

## File placement in the repo

```
projects/composition/src/app/pages/<component>-page/
├── <component>-page.component.ts
├── <component>-page.component.html
├── <component>-page.component.scss
└── <component>-page.examples.ts   ← generated file goes here
```
