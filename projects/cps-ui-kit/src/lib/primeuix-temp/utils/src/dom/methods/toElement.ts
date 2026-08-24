/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/toElement.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import isElement from './isElement';

type ReactElement = { current: Element | null | undefined };
type VueElement = { el: Element | null | undefined };
type AngularElement = { el: { nativeElement: Element | undefined } };

export default function toElement(element: unknown): Element | null | undefined {
    let target = element;

    if (element && typeof element === 'object') {
        if (Object.hasOwn(element, 'current')) {
            // For React
            target = (element as ReactElement).current;
        } else if (Object.hasOwn(element, 'el')) {
            if (Object.hasOwn((element as AngularElement).el, 'nativeElement')) {
                // For Angular
                target = (element as AngularElement).el.nativeElement;
            } else {
                // For Vue
                target = (element as VueElement).el;
            }
        }
    }

    return isElement(target) ? target : undefined;
}
