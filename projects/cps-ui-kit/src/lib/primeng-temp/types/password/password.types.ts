// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/types/password/password.types.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { TemplateRef } from '@angular/core';
import type { MotionOptions } from '@primeuix/motion';
import type { PassThrough, PassThroughOption } from '../../api/public_api';
import type { InputTextPassThrough } from '../inputtext/public_api';
import type { OverlayPassThrough } from '../overlay/public_api';

/**
 * Custom pass-through(pt) options.
 * @template I Type of instance.
 *
 * @see {@link Password.pt}
 * @group Interface
 */
export interface PasswordPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the host element.
     */
    host?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the InputText component.
     * @see {@link InputTextPassThrough}
     */
    pcInputText?: InputTextPassThrough;
    /**
     * Used to pass attributes to the clear icon's DOM element.
     */
    clearIcon?: PassThroughOption<HTMLElement, I>;
    /**
     * Used to pass attributes to the mask icon's DOM element.
     */
    maskIcon?: PassThroughOption<HTMLElement, I>;
    /**
     * Used to pass attributes to the unmask icon's DOM element.
     */
    unmaskIcon?: PassThroughOption<HTMLElement, I>;
    /**
     * Used to pass attributes to the Overlay component.
     * @see {@link OverlayPassThrough}
     */
    pcOverlay?: OverlayPassThrough;
    /**
     * Used to pass attributes to the overlay's DOM element.
     */
    overlay?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the content's DOM element.
     */
    content?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the meter's DOM element.
     */
    meter?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the meter label's DOM element.
     */
    meterLabel?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the meter text's DOM element.
     */
    meterText?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass options to the motion component/directive.
     */
    motion?: MotionOptions;
}

/**
 * Defines valid pass-through options in Password.
 * @see {@link PasswordPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type PasswordPassThrough<I = unknown> = PassThrough<I, PasswordPassThroughOptions<I>>;

/**
 * Custom icon template context.
 * @group Interface
 */
export interface PasswordIconTemplateContext {
    /**
     * Style class of the icon.
     */
    class: string;
}

/**
 * Defines valid templates in Password.
 * @group Templates
 */
export interface PasswordTemplates {
    /**
     * Custom template of header.
     */
    header(): TemplateRef<void>;
    /**
     * Custom template of content.
     */
    content(): TemplateRef<void>;
    /**
     * Custom template of footer.
     */
    footer(): TemplateRef<void>;
    /**
     * Custom template of clear icon.
     */
    clearicon(): TemplateRef<void>;
    /**
     * Custom template of hide icon.
     * @param {PasswordIconTemplateContext} context - icon context.
     */
    hideicon(context: PasswordIconTemplateContext): TemplateRef<PasswordIconTemplateContext>;
    /**
     * Custom template of show icon.
     * @param {PasswordIconTemplateContext} context - icon context.
     */
    showicon(context: PasswordIconTemplateContext): TemplateRef<PasswordIconTemplateContext>;
}
