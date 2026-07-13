/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/zindex/index.ts
 * Modified: import paths rewritten to resolve locally. See ../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
export interface ZIndexOptions {
    get(element?: HTMLElement): number;
    set(key: string, element: HTMLElement, baseZIndex?: number): void;
    clear(element: HTMLElement): void;
    getCurrent(key: string): number;
}

function handler(): ZIndexOptions {
    let zIndexes: { key: string; value: number }[] = [];

    const generateZIndex = (key: string, autoZIndex: boolean, baseZIndex: number = 999) => {
        const lastZIndex = getLastZIndex(key, autoZIndex, baseZIndex);
        const newZIndex = lastZIndex.value + (lastZIndex.key === key ? 0 : baseZIndex) + 1;

        zIndexes.push({ key, value: newZIndex });

        return newZIndex;
    };

    const revertZIndex = (zIndex: number) => {
        zIndexes = zIndexes.filter((obj) => obj.value !== zIndex);
    };

    const getCurrentZIndex = (key: string, autoZIndex: boolean) => {
        return getLastZIndex(key, autoZIndex).value;
    };

    const getLastZIndex = (key: string, autoZIndex: boolean, baseZIndex: number = 0) => {
        return [...zIndexes].reverse().find((obj) => (autoZIndex ? true : obj.key === key)) || { key, value: baseZIndex };
    };

    const getZIndex = (element?: HTMLElement): number => {
        return element ? parseInt(element.style.zIndex, 10) || 0 : 0;
    };

    return {
        get: getZIndex,
        set: (key: string, element?: HTMLElement, baseZIndex?: number) => {
            if (element) {
                element.style.zIndex = String(generateZIndex(key, true, baseZIndex));
            }
        },
        clear: (element?: HTMLElement) => {
            if (element) {
                revertZIndex(getZIndex(element));
                element.style.zIndex = '';
            }
        },
        getCurrent: (key: string) => getCurrentZIndex(key, true)
    };
}

export const ZIndex: ZIndexOptions = handler();
