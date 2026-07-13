// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/types/inputotp/inputotp.types.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { TemplateRef } from '@angular/core';
import type { PassThrough, PassThroughOption } from '../../api/public_api';
import type { InputTextPassThrough } from '../inputtext/public_api';

/**
 * Custom pass-through(pt) options.
 * @template I Type of instance.
 *
 * @see {@link InputOtp.pt}
 * @group Interface
 */
export interface InputOtpPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the host's DOM element.
     */
    host?: PassThroughOption<HTMLElement, I>;
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the InputText component.
     */
    pcInputText?: InputTextPassThrough;
}

/**
 * Custom passthrough attributes for each DOM elements
 * @group Interface
 */
export type InputOtpPassThrough<I = unknown> = PassThrough<I, InputOtpPassThroughOptions<I>>;

/**
 * Input change event.
 * @group Events
 */
export interface InputOtpChangeEvent {
    /**
     * Browser event.
     */
    originalEvent: Event;
    /**
     * Updated value.
     */
    value: any;
}

/**
 * Context interface for the input template events.
 * @group Interface
 */
export interface InputOtpTemplateEvents {
    /**
     * Input event handler.
     */
    input: (event: Event, index: number) => void;
    /**
     * Keydown event handler.
     */
    keydown: (event: Event) => void;
    /**
     * Focus event handler.
     */
    focus: (event: Event) => void;
    /**
     * Blur event handler.
     */
    blur: (event: Event) => void;
    /**
     * Paste event handler.
     */
    paste: (event: Event) => void;
}

/**
 * Custom input template context.
 * @group Interface
 */
export interface InputOtpInputTemplateContext {
    /**
     * Token value.
     */
    $implicit: number | string;
    /**
     * Browser events of the template.
     */
    events: InputOtpTemplateEvents;
    /**
     * Index of the token.
     */
    index: number;
}

/**
 * Defines valid templates in InputOtp.
 * @group Templates
 */
export interface InputOtpTemplates {
    /**
     * Custom input template.
     * @param {Object} context - input context.
     */
    input(context: InputOtpInputTemplateContext): TemplateRef<InputOtpInputTemplateContext>;
}
