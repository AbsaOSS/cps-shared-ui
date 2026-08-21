// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/types/radiobutton/radiobutton.types.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { PassThrough, PassThroughOption } from '../../api/public_api';

/**
 * Custom passthrough(pt) options.
 * @template I Type of instance.
 *
 * @see {@link RadioButton.pt}
 * @group Interface
 */
export interface RadioButtonPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the input's DOM element.
     */
    input?: PassThroughOption<HTMLInputElement, I>;
    /**
     * Used to pass attributes to the box's DOM element.
     */
    box?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the icon's DOM element.
     */
    icon?: PassThroughOption<HTMLDivElement, I>;
}

/**
 * Defines valid pass-through options in RadioButton component.
 * @see {@link RadioButtonPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type RadioButtonPassThrough<I = unknown> = PassThrough<I, RadioButtonPassThroughOptions<I>>;

/**
 * Custom click event.
 * @see {@link RadioButton.onClick}
 * @group Events
 */
export interface RadioButtonClickEvent {
    /**
     * Browser event.
     */
    originalEvent: Event;
    /**
     * Browser event.
     */
    value: any;
}
