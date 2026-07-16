/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/invokeElementMethod.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
export default function invokeElementMethod<T extends keyof Element>(element: Element, methodName: T, args?: unknown[]): void {
    const method = element[methodName];

    if (typeof method === 'function') {
        (method as (...args: unknown[]) => void).apply(element, args ?? []);
    }
}
