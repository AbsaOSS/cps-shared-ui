/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/fadeIn.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
export default function fadeIn(element: HTMLElement, duration: number): void {
    if (element) {
        element.style.opacity = '0';

        let last = +new Date();
        let opacity = '0';

        const tick = function () {
            opacity = `${+element.style.opacity + (new Date().getTime() - last) / duration}`;
            element.style.opacity = opacity;
            last = +new Date();

            if (+opacity < 1) {
                if ('requestAnimationFrame' in window) requestAnimationFrame(tick);
                else setTimeout(tick, 16);
            }
        };

        tick();
    }
}
