/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/removeClass.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
export default function removeClass(element: Element, className: string | undefined | null | (string | undefined | null)[]): void {
    if (element && className) {
        const fn = (_className: string) => {
            if (element.classList) element.classList.remove(_className);
            else element.className = element.className.replace(new RegExp('(^|\\b)' + _className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
        };

        [className]
            .flat()
            .filter(Boolean)
            .forEach((_classNames) => (_classNames as string).split(' ').forEach(fn));
    }
}
