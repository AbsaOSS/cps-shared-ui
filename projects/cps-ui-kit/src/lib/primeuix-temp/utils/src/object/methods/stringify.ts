/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/object/methods/stringify.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import isArray from './isArray';
import isDate from './isDate';
import isFunction from './isFunction';
import isObject from './isObject';

export default function stringify(value: unknown, indent: number = 2, currentIndent: number = 0): string {
    const currentIndentStr = ' '.repeat(currentIndent);
    const nextIndentStr = ' '.repeat(currentIndent + indent);

    if (isArray(value)) {
        return '[' + (value as unknown[]).map((v: unknown) => stringify(v, indent, currentIndent + indent)).join(', ') + ']';
    } else if (isDate(value)) {
        return value.toISOString();
    } else if (isFunction(value)) {
        return value.toString();
    } else if (isObject(value)) {
        return (
            '{\n' +
            Object.entries(value)
                .map(([k, v]) => `${nextIndentStr}${k}: ${stringify(v, indent, currentIndent + indent)}`)
                .join(',\n') +
            `\n${currentIndentStr}` +
            '}'
        );
    } else {
        return JSON.stringify(value);
    }
}
