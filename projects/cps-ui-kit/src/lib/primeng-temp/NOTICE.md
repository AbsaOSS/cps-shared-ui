# Third-party notice: PrimeNG

The code in this directory (`projects/cps-ui-kit/src/lib/primeng-temp/`) is vendored
from [PrimeNG](https://github.com/primefaces/primeng), the last MIT-licensed release
of that project.

- **Source repository**: https://github.com/primefaces/primeng
- **Tag**: `21.1.9`
- **Commit**: `c493b1c6d9f7cdffbe1c4dc195493dd73d733593`
- **Fetched**: 2026-07-13
- **Vendored from**: `packages/primeng/src/<module>/` in the upstream repository

Initially vendored as 437 files (the full contents of each of the 37 PrimeNG modules
cps-ui-kit's components transitively depend on). A subsequent call-graph analysis
(2026-07-14) found 20 files that were never actually imported by anything — whole
`types/<component>/` directories for components that were never vendored at all
(`chart`, `contextmenu`, `dataview`, `multiselect`, `password`, `picklist`, `textarea`),
plus a handful of orphaned `index.ts` stubs shadowed by the `public_api.ts` that every
real consumer actually resolves through. These were removed, leaving 417 files. Verified
by rebuilding after deletion (not just by trusting the static analysis), which is the
only way this kind of check is trustworthy.

PrimeNG dropped MIT licensing starting with major version 22 (see
https://primeui.dev/nextchapter). Version 21.1.9 is the final MIT release, and remains
MIT "forever" per PrimeTek's own announcement — this vendored copy is legitimately
licensed. This directory exists so `cps-ui-kit` no longer depends on the `primeng` npm
package at all, avoiding any future dependency on PrimeNG's post-v21 commercial/community
license terms.

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
the following modifications were made to every file in this directory relative to
upstream. No modification changes runtime behavior; all are type-checking or
module-resolution adjustments needed to compile unmodified upstream logic under this
repository's tooling:

1. **Import paths rewritten.** Every `primeng/<module>` import specifier was mechanically
   rewritten to a relative path pointing at the corresponding vendored file (there is no
   `primeng` npm package installed in this repository anymore). Applied via
   `scripts/rewrite-primeng-imports.mjs`.
2. **`// @ts-nocheck` added to every file.** This repository's `tsconfig.json` is
   considerably stricter than PrimeNG's own (`strict`, `noImplicitOverride`,
   `noUnusedLocals`/`noUnusedParameters`, etc.). Rather than editing hundreds of
   upstream files to satisfy diagnostics PrimeNG's own build never enforced,
   `@ts-nocheck` suppresses ordinary TypeScript checking for this vendored, frozen code.
3. **A small number of shared-helper type signatures were widened** (e.g.
   `BaseComponent.cx()` in `basecomponent/basecomponent.ts` now always returns `string`
   instead of `string | undefined`; a few `@Input()`/`input()` types in `autofocus.ts`,
   `togglebutton.ts`, and `badge.ts` were widened to match how they're actually used
   elsewhere in the vendored tree) — done only where a single root-cause type was
   responsible for many downstream Angular template type errors, and only ever by
   *widening* a type (adding `| undefined` or missing union members), never narrowing
   or changing logic.
4. **`$any(...)` casts added at ~130 specific template expressions and `@HostListener`
   argument strings** (across `table.ts`, `treetable.ts`, `tree.ts`, `datepicker.ts`,
   `overlay.ts`, `select.ts`, `scroller.ts`, `paginator.ts`, `inputnumber.ts`) where
   Angular's `strictTemplates` (enabled in this repo, not enabled upstream) flagged a
   type mismatch that plain `@ts-nocheck` cannot suppress (Angular's template
   type-checker generates a separate synthetic check that ignores the source file's
   `@ts-nocheck` pragma). `$any()` is Angular's own documented escape hatch for this
   exact situation — it affects type-checking only and compiles away with zero runtime
   effect. Each of these was left otherwise untouched, including a couple of cases
   confirmed to reproduce pre-existing upstream quirks verbatim (e.g.
   `treetable.ts`'s non-virtual-scroll branch references a `serializedValue` property
   that doesn't exist on that component either in this vendored copy or in upstream
   21.1.9 — both resolve it to `undefined` at runtime the same way; wrapped as
   `$any(this).serializedValue` here purely to satisfy the compiler, not to change
   what it evaluates to).
5. **One dead template binding removed**, in `table.ts`'s
   `ColumnFilterFormElement`: `[showButtons]="showButtons"` was bound to a property
   that only exists as a read-only getter (not an `@Input()`) on that component in
   both upstream and here, so the binding was already an inert no-op at runtime
   (Angular's strict "unknown property" check flags this structurally; it isn't a
   type mismatch `$any()` can suppress). Removing the binding changes nothing at
   runtime — the getter still independently derives its value via DI from `colFilter`.
6. **One structural template rewrite**, in `tree.ts`'s empty-state block: upstream's
   `*ngIf="cond; else emptyFilter"` paired with a separately-referenced
   `<ng-template #emptyFilter>` doesn't resolve correctly when combined with a
   structural directive on the `#emptyFilter`-referenced template in this compiler
   configuration. Rewritten using equivalent `@if (cond) { … } @else { … }` block
   syntax with the exact same two branches and condition — behaviorally identical,
   confirmed against upstream.

No other changes were made. Component logic, styles, and public APIs are otherwise
unmodified from PrimeNG 21.1.9.

Every vendored file also carries a short header comment identifying its original path
and pointing back to this notice.

This code in turn depends on `@primeuix/utils`, `@primeuix/styled`, and
`@primeuix/motion` (design-token/styling and motion helpers from the same PrimeTek
organization) — those are also vendored locally rather than kept as npm dependencies;
see `../primeuix-temp/NOTICE.md`.
