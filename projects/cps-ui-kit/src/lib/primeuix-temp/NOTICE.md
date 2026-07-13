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

Unlike PrimeNG, `primeuix` doesn't tag releases matching the currently-installed npm
package versions (its git tags stop at `0.6.0`, and npm does not record a `gitHead` for
these packages), so this is vendored from the repository's current default-branch HEAD
at the commit above rather than a version-matched tag. Every function/symbol actually
used by the vendored PrimeNG code was confirmed present in this commit with the same
shape before vendoring. There is minor version drift versus what was previously
installed via npm: `@primeuix/utils` was at `0.7.2` (this commit is `0.6.4`) and
`@primeuix/motion` was at `0.0.10` (this commit is `0.0.11`); `@primeuix/styled` and
`@primeuix/styles` match their installed versions (`0.7.4` and `2.0.3`) exactly. These
are small, low-churn utility/helper packages (DOM helpers, class-name/style-token
merging, motion/animation event handling) rather than stateful UI components, so this
drift was assessed as low risk.

## License

MIT, reproduced below verbatim from upstream's root `LICENSE` file (the whole `primeuix`
repository, unlike PrimeNG, is under a single license with no LTS/commercial split):

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
[LICENSE](../../../../../LICENSE)), the following modifications were made:

1. **Import paths rewritten.** Every `@primeuix/<pkg>[/<subpath>]` import specifier was
   mechanically rewritten to a relative path pointing at the corresponding vendored
   file's `src/` location (there is no `@primeuix/*` npm package installed in this
   repository anymore). Applied via `scripts/rewrite-primeuix-imports.mjs`. Plain
   relative imports already present in the upstream source (e.g. within `styled`'s
   `helpers/color/` files) were left untouched — the original `src/`/`types/` directory
   nesting was preserved exactly per package so those continue to resolve correctly.
2. **Directory structure preserved as-is per package** (`<pkg>/src/**`, plus
   `motion/types/**`), unlike `../primeng-temp/` which drops the `src/` segment — this
   is because `@primeuix/motion`'s own source has a real relative import
   (`../types`) reaching outside its `src/` directory into a sibling `types/`
   directory, so the original nesting depth had to be kept intact for that import to
   keep resolving correctly.
3. **`@primeuix/styles` scoped to only the 17 component subdirectories actually used**
   by the vendored PrimeNG code (`badge, base, button, checkbox, datatable, datepicker,
   iconfield, inputnumber, inputtext, paginator, radiobutton, ripple, select,
   selectbutton, togglebutton, tooltip, tree`), out of 94 available upstream — each is a
   single self-contained file with zero internal imports, confirmed safe to vendor
   independently without pulling in the rest.
4. No `// @ts-nocheck` was needed here (unlike `../primeng-temp/`): `primeuix`'s own
   `tsconfig.json` already uses `strict: true` plus the same `noUnusedLocals`/
   `noUnusedParameters`/`noImplicitOverride` settings as this repository. Only 7 small,
   purely mechanical fixes were needed to compile cleanly, none changing behavior:
   - `motion/src/config/index.ts`: added an explicit trailing `return;` to `whenEnd()`
     so all code paths return a value (`noImplicitReturns`) — the function already fell
     through to an implicit `undefined` return; this just makes it explicit.
   - `styled/src/utils/themeUtils.ts` (`getCommon`, `getPreset`, `getLayerOrder`) and
     `styled/src/utils/sharedUtils.ts` (`getVariableValue`): renamed 6 parameters that
     are genuinely unused within their own function bodies (kept for call-site/interface
     consistency with sibling functions) with a leading underscore — for destructured
     object parameters this was done as `params: _params` to keep extracting the same
     source key while renaming the unused local binding, so calling code is unaffected.
   - `styled/src/stylesheet/index.ts`: same underscore-prefix rename for `meta` on an
     abstract stub method that always returns `undefined` (upstream already has an
     `eslint-disable-next-line` comment acknowledging this parameter is unused there).

No other changes were made. Logic, types, and public API are otherwise unmodified from
the source commit above.
