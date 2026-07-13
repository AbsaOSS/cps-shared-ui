// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/types/colorpicker/colorpicker.types.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import type { MotionOptions } from '@primeuix/motion';
import type { PassThrough, PassThroughOption } from '../../api/public_api';

/**
 * Custom pass-through(pt) options.
 * @template I Type of instance.
 *
 * @see {@link ColorPicker.pt}
 * @group Interface
 */
export interface ColorPickerPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the host's DOM element.
     */
    host?: PassThroughOption<HTMLElement, I>;
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the preview input's DOM element.
     */
    preview?: PassThroughOption<HTMLInputElement, I>;
    /**
     * Used to pass attributes to the panel's DOM element.
     */
    panel?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the content's DOM element.
     */
    content?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the color selector's DOM element.
     */
    colorSelector?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the color background's DOM element.
     */
    colorBackground?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the color handle's DOM element.
     */
    colorHandle?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the hue's DOM element.
     */
    hue?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the hue handle's DOM element.
     */
    hueHandle?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass options to the motion component/directive.
     */
    motion?: MotionOptions;
}

/**
 * Custom passthrough attributes for each DOM elements
 * @group Interface
 */
export type ColorPickerPassThrough<I = unknown> = PassThrough<I, ColorPickerPassThroughOptions<I>>;

/**
 * Custom change event.
 * @see {@link ColorPicker.onChange}
 * @group Events
 */
export interface ColorPickerChangeEvent {
    /**
     * Browser event
     */
    originalEvent: Event;
    /**
     * Selected color value.
     */
    value: string | object;
}
