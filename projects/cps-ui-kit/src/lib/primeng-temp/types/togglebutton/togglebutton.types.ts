// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/types/togglebutton/togglebutton.types.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { TemplateRef } from '@angular/core';
import type { PassThrough, PassThroughOption } from '../../api/public_api';

/**
 * Custom pass-through(pt) options.
 * @template I Type of instance.
 *
 * @see {@link ToggleButtonProps.pt}
 * @group Interface
 */
export interface ToggleButtonPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the content's DOM element.
     */
    content?: PassThroughOption<HTMLSpanElement, I>;
    /**
     * Used to pass attributes to the icon's DOM element.
     */
    icon?: PassThroughOption<HTMLSpanElement, I>;
    /**
     * Used to pass attributes to the label's DOM element.
     */
    label?: PassThroughOption<HTMLSpanElement, I>;
}

/**
 * Custom passthrough attributes for each DOM elements
 * @group Interface
 */
export type ToggleButtonPassThrough<I = unknown> = PassThrough<I, ToggleButtonPassThroughOptions<I>>;

/**
 * Custom change event.
 * @see {@link ToggleButton.onChange}
 * @group Events
 */
export interface ToggleButtonChangeEvent {
    /**
     * Browser event.
     */
    originalEvent: Event;
    /**
     * Checked state as a boolean.
     */
    checked: boolean;
}

/**
 * Custom icon template context.
 * @group Interface
 */
export interface ToggleButtonIconTemplateContext {
    /**
     * Checked state.
     */
    $implicit: boolean;
}

/**
 * Custom content template context.
 * @group Interface
 */
export interface ToggleButtonContentTemplateContext {
    /**
     * Checked state.
     */
    $implicit: boolean;
}

/**
 * Defines valid templates in ToggleButton.
 * @group Templates
 */
export interface ToggleButtonTemplates {
    /**
     * Custom icon template.
     * @param {ToggleButtonIconTemplateContext} context - icon context.
     */
    icon(context: ToggleButtonIconTemplateContext): TemplateRef<ToggleButtonIconTemplateContext>;
    /**
     * Custom content template.
     * @param {ToggleButtonContentTemplateContext} context - content context.
     */
    content(context: ToggleButtonContentTemplateContext): TemplateRef<ToggleButtonContentTemplateContext>;
}
