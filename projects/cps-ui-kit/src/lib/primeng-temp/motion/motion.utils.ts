// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/motion/motion.utils.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
const originalStyles = new WeakMap<HTMLElement, { display?: string; visibility?: string; maxHeight?: string; overflow?: string }>();

export function applyHiddenStyles(element: HTMLElement, strategy: 'display' | 'visibility') {
    if (!element) return;

    if (!originalStyles.has(element)) {
        originalStyles.set(element, {
            display: element.style.display,
            visibility: element.style.visibility,
            maxHeight: element.style.maxHeight,
            overflow: element.style.overflow
        });
    }

    switch (strategy) {
        case 'display':
            element.style.display = 'none';
            break;
        case 'visibility':
            element.style.visibility = 'hidden';
            element.style.maxHeight = '0';
            element.style.overflow = 'hidden';
            break;
    }
}

export function resetStyles(element: HTMLElement, strategy: 'display' | 'visibility') {
    if (!element) return;

    const original = originalStyles.get(element) ?? element.style;

    switch (strategy) {
        case 'display':
            element.style.display = original?.display || '';
            break;
        case 'visibility':
            element.style.visibility = original?.visibility || '';
            element.style.maxHeight = original?.maxHeight || '';
            element.style.overflow = original?.overflow || '';
            break;
    }

    originalStyles.delete(element);
}
