/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/styled/src/actions/updateSurfacePalette.ts
 * Modified: import paths rewritten to resolve locally. See ../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import { $t } from '../helpers/index';

export default function updateSurfacePalette<T = unknown, P = unknown>(palette?: T): P {
    return $t().surfacePalette(palette).update().preset as P;
}
