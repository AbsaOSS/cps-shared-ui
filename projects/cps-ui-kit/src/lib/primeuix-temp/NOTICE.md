# Third-party notice: primeuix

The code in this directory (`projects/cps-ui-kit/src/lib/primeuix-temp/`) is vendored
from [primeuix](https://github.com/primefaces/primeuix) — specifically the `utils`,
`styled`, `motion`, and `styles` packages (published to npm as `@primeuix/utils`,
`@primeuix/styled`, `@primeuix/motion`, `@primeuix/styles`), which the vendored PrimeNG
code in `../primeng-temp/` depends on.

- **Source repository**: https://github.com/primefaces/primeuix
- **Commit**: `b9467bc448d35738d4f651dbc3caa4d4cb9a6a96`
- **Fetched**: 2026-07-13
- **Vendored from**: `packages/<utils|styled|motion|styles>/src/` (and `packages/motion/types/`)
  in the upstream repository

The whole `primeuix` repository is MIT licensed under a single unified license (no
LTS/commercial split, unlike PrimeNG). `primeuix` doesn't tag releases matching
currently-installed npm package versions (its git tags stop at `0.6.0`, and npm doesn't
record a `gitHead` for these packages), so this is vendored from the repository's
default-branch HEAD at the commit above rather than a version-matched tag. Every
function/symbol used by the vendored PrimeNG code was confirmed present at this commit
with the same shape. There is minor version drift versus what was previously installed
via npm — `@primeuix/utils` was `0.7.2` (this commit is `0.6.4`) and `@primeuix/motion`
was `0.0.10` (this commit is `0.0.11`); `@primeuix/styled` and `@primeuix/styles` match
their installed versions (`0.7.4` and `2.0.3`) exactly. These are small, low-churn
utility/helper packages (DOM helpers, class-name/style-token merging, motion/animation
event handling) rather than stateful UI components, so this drift is low risk.

This directory contains 116 files: `utils` and `styled` are pruned via call-graph
tracing to only the code actually reachable from the vendored PrimeNG code (including
internal cross-references, e.g. `styled`'s `ThemeService` uses `utils`'s `EventBus`),
`motion` in full (4 files, all used), and `styles` scoped to the 17 component
subdirectories the vendored PrimeNG code references (of 94 available upstream — each is
a single self-contained file with no internal imports, safe to vendor independently).

## License

MIT, reproduced below verbatim from upstream's root `LICENSE` file:

```
MIT License

Copyright (c) 2025 PrimeTek

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Modifications

Per the MIT license's own terms and Apache-2.0 §4(b) of this repository's own license
(this repository is Apache-2.0 licensed; see the root
[LICENSE](../../../../../LICENSE)):

1. **Import paths rewritten.** Every `@primeuix/<pkg>[/<subpath>]` import specifier is a
   relative path pointing at the corresponding vendored file's `src/` location (there is
   no `@primeuix/*` npm package installed in this repository). Plain relative imports
   already present in the upstream source (e.g. within `styled`'s `helpers/color/`
   files) are untouched.
2. **Directory structure preserved as-is per package** (`<pkg>/src/**`, plus
   `motion/types/**`), unlike `../primeng-temp/` which drops the `src/` segment — this
   is because `@primeuix/motion`'s own source has a real relative import (`../types`)
   reaching outside its `src/` directory into a sibling `types/` directory, so the
   original nesting depth is kept intact for that import to resolve correctly.
3. **No `// @ts-nocheck`** (unlike `../primeng-temp/`): `primeuix`'s own `tsconfig.json`
   already uses `strict: true` plus the same `noUnusedLocals`/`noUnusedParameters`/
   `noImplicitOverride` settings as this repository. Seven small, purely mechanical
   fixes were needed to compile cleanly, none changing behavior:
   - `motion/src/config/index.ts`: an explicit trailing `return;` added to `whenEnd()`
     so all code paths return a value — the function already fell through to an
     implicit `undefined` return.
   - `styled/src/utils/themeUtils.ts` (`getCommon`, `getPreset`, `getLayerOrder`) and
     `styled/src/utils/sharedUtils.ts` (`getVariableValue`): 6 parameters that are
     unused within their own function bodies (kept for call-site/interface consistency
     with sibling functions) renamed with a leading underscore — for destructured
     object parameters this is `params: _params`, to keep extracting the same source
     key while renaming the unused local binding.
   - `styled/src/stylesheet/index.ts`: same underscore-prefix rename for `meta` on an
     abstract stub method that always returns `undefined`.

No other changes were made. Logic, types, and public API are otherwise unmodified from
the source commit above.
