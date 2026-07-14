# Third-party notice: PrimeNG

The code in this directory (`projects/cps-ui-kit/src/lib/primeng-temp/`) is vendored
from [PrimeNG](https://github.com/primefaces/primeng), the last MIT-licensed release
of that project.

- **Source repository**: https://github.com/primefaces/primeng
- **Tag**: `21.1.9`
- **Commit**: `c493b1c6d9f7cdffbe1c4dc195493dd73d733593`
- **Fetched**: 2026-07-13
- **Vendored from**: `packages/primeng/src/<module>/` in the upstream repository

PrimeNG dropped MIT licensing starting with major version 22 (see
https://primeui.dev/nextchapter). Version 21.1.9 is the final MIT release, and remains
MIT "forever" per PrimeTek's own announcement — this vendored copy is legitimately
licensed. This directory exists so `cps-ui-kit` no longer depends on the `primeng` npm
package at all, avoiding any future dependency on PrimeNG's post-v21 commercial/community
license terms.

This directory contains the 417 files of the 37 PrimeNG modules that `cps-ui-kit`'s
components transitively depend on. It excludes files that are never actually referenced:
whole `types/<component>/` directories for components that aren't vendored (`chart`,
`contextmenu`, `dataview`, `multiselect`, `password`, `picklist`, `textarea`), and a few
orphaned `index.ts` stubs shadowed by the `public_api.ts` that every real consumer
resolves through instead.

This code in turn depends on `@primeuix/utils`, `@primeuix/styled`, and
`@primeuix/motion` (design-token/styling and motion helpers from the same PrimeTek
organization) — those are also vendored locally rather than kept as npm dependencies;
see `../primeuix-temp/NOTICE.md`.

## License

The code in this directory is licensed under the MIT License, reproduced below verbatim
from upstream's `LICENSE.md` (scoped to the "PRIMENG COMMUNITY VERSIONS LICENSE" section
only — upstream's `LICENSE.md` also bundles a separate commercial "PRIMENG LTS VERSIONS
LICENSE" for `-lts`-suffixed packages, which does not apply here; nothing in this
directory was sourced from an `-lts` package).

```
The MIT License (MIT)

Copyright (c) 2016-2026 PrimeTek

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

## Modifications

Per the MIT license's own terms and Apache-2.0 §4(b) of this repository's own license
(this repository is Apache-2.0 licensed; see the root [LICENSE](../../../../../LICENSE)),
every file in this directory carries a header comment identifying its original upstream
path and noting it was modified. None of the modifications below change runtime
behavior — all are type-checking or module-resolution adjustments needed to compile
unmodified upstream logic under this repository's stricter tooling:

1. **Import paths rewritten.** Every `primeng/<module>` import specifier is a relative
   path pointing at the corresponding vendored file (there is no `primeng` npm package
   installed in this repository).
2. **`// @ts-nocheck` on every file.** This repository's `tsconfig.json` is considerably
   stricter than PrimeNG's own (`strict`, `noImplicitOverride`, `noUnusedLocals`/
   `noUnusedParameters`, etc.), which PrimeNG's own code wasn't written against.
3. **A small number of shared-helper types widened** (never narrowed) to match how
   they're actually used at runtime, where a single root-cause type was responsible for
   many downstream Angular template type errors:
   - `BaseComponent.cx()` (`basecomponent/basecomponent.ts`) always returns `string`
     instead of `string | undefined`.
   - A few `@Input()`/`input()` types in `autofocus.ts`, `togglebutton.ts`, and
     `badge.ts` widened to include `| undefined`.
   - `button.ts`: `Button.buttonProps` and `ButtonDirective.buttonProps` widened to
     `ButtonProps | undefined` — neither `<p-button>` nor `pButton` is ever bound with
     `[buttonProps]` anywhere in this codebase, so the property is genuinely `undefined`
     unless a future consumer sets it explicitly.
4. **`$any(...)` casts at template expressions and `@HostListener` argument strings**
   (across `table.ts`, `treetable.ts`, `tree.ts`, `datepicker.ts`, `overlay.ts`,
   `select.ts`, `scroller.ts`, `paginator.ts`, `inputnumber.ts`) where Angular's
   `strictTemplates` (enabled here, not upstream) flags a type mismatch that
   `@ts-nocheck` can't suppress (Angular's template type-checker runs a separate
   synthetic check that ignores the source file's `@ts-nocheck` pragma). `$any()` is
   Angular's own documented escape hatch for this — type-checking only, zero runtime
   effect. A couple of these reproduce pre-existing upstream quirks verbatim rather than
   "fixing" them — e.g. `treetable.ts`'s non-virtual-scroll branch references a
   `serializedValue` property that doesn't exist on that component either here or
   upstream; both resolve it to `undefined` at runtime the same way.
5. **One dead template binding removed**, in `table.ts`'s `ColumnFilterFormElement`:
   `[showButtons]="showButtons"` was bound to a property that only exists as a
   read-only getter (not an `@Input()`) on that component in both upstream and here, so
   it was already an inert no-op — the getter still independently derives its value via
   DI from `colFilter`.
6. **One structural template rewrite**, in `tree.ts`'s empty-state block: upstream's
   `*ngIf="cond; else emptyFilter"` paired with a separately-referenced
   `<ng-template #emptyFilter>` doesn't resolve correctly in this compiler
   configuration. Rewritten using equivalent `@if (cond) { … } @else { … }` block
   syntax with the same two branches and condition — behaviorally identical.
7. **A few genuinely-unnecessary `?.` operators removed**, where the operand is
   provably always defined at runtime: `table.ts`'s `filterButtonProps?.` (5 sites —
   `filterButtonProps` has a full default object value so is never `undefined`; the
   deeper `popover?.x` chains were kept, since `popover`'s own type legitimately allows
   `undefined`), and `tree.ts`'s `$event.target?.value` (a native DOM event bound
   directly on a static element guarantees a non-null `target`).

No other changes were made. Component logic, styles, and public APIs are otherwise
unmodified from PrimeNG 21.1.9.
