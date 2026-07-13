/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/hasCSSAnimation.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
export default function hasCSSAnimation(element: Element): boolean {
    if (element) {
        const style = getComputedStyle(element);
        const animationDuration = parseFloat(style.getPropertyValue('animation-duration') || '0');

        return animationDuration > 0;
    }

    return false;
}
