/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/object/methods/nestedKeys.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import isObject from './isObject';

export default function nestedKeys(obj: Record<string, any> = {}, parentKey: string = ''): string[] {
    return Object.entries(obj).reduce<string[]>((o, [key, value]) => {
        const currentKey = parentKey ? `${parentKey}.${key}` : key;

        isObject(value) ? (o = o.concat(nestedKeys(value, currentKey))) : o.push(currentKey);

        return o;
    }, []);
}
