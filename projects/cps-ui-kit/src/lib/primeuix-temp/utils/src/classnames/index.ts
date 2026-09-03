/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/classnames/index.ts
 * Modified: import paths rewritten to resolve locally. See ../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
export function cn(...args: any[]): string | undefined {
    if (args) {
        let classes: any = [];

        for (let i = 0; i < args.length; i++) {
            const className = args[i];

            if (!className) {
                continue;
            }

            const type = typeof className;

            if (type === 'string' || type === 'number') {
                classes.push(className);
            } else if (type === 'object') {
                const _classes = Array.isArray(className) ? [cn(...className)] : Object.entries(className).map(([key, value]) => (value ? key : undefined));

                classes = _classes.length ? classes.concat(_classes.filter((c) => !!c)) : classes;
            }
        }

        return classes.join(' ').trim();
    }

    return undefined;
}

/**
 * @deprecated Use `cn` instead.
 * @param args
 * @returns
 */
export function classNames(...args: any[]): string | undefined {
    return cn(...args);
}
