/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/alignOverlay.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import absolutePosition from './absolutePosition';
import getOuterWidth from './getOuterWidth';
import relativePosition from './relativePosition';

export default function alignOverlay(overlay: HTMLElement, target: HTMLElement, appendTo: string, calculateMinWidth: boolean = true) {
    if (overlay && target) {
        if (appendTo === 'self') {
            relativePosition(overlay, target);
        } else {
            if (calculateMinWidth) overlay.style.minWidth = getOuterWidth(target) + 'px';
            absolutePosition(overlay, target);
        }
    }
}
