/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/mergeprops/index.ts
 * Modified: import paths rewritten to resolve locally. See ../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import { cn } from '../classnames';
import { isFunction } from '../object';

function _mergeProps({ skipUndefined = false }, ...props: any[]): object | undefined {
    return props?.reduce((merged, ps = {}) => {
        for (const key in ps) {
            const value = ps[key];

            if (skipUndefined && value === undefined) continue;

            if (key === 'style') {
                merged['style'] = { ...merged['style'], ...ps['style'] };
            } else if (key === 'class' || key === 'className') {
                merged[key] = cn(merged[key], ps[key]);
            } else if (isFunction(value)) {
                const fn = merged[key];

                merged[key] = fn
                    ? (...args: any[]) => {
                          fn(...args);
                          value(...args);
                      }
                    : value;
            } else {
                merged[key] = value;
            }
        }

        return merged;
    }, {});
}

export function mergeProps(...props: any[]): object | undefined {
    return _mergeProps({ skipUndefined: false }, ...props);
}

export function mergeDefaultProps(...props: any[]): object | undefined {
    return _mergeProps({ skipUndefined: true }, ...props);
}
