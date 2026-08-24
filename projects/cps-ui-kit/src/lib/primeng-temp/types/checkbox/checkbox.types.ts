// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/types/checkbox/checkbox.types.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { TemplateRef } from '@angular/core';
import type { PassThrough, PassThroughOption } from '../../api/public_api';

/**
 * Custom change event.
 * @see {@link Checkbox.onChange}
 * @group Events
 */
export interface CheckboxChangeEvent {
    /**
     * Checked value.
     */
    checked?: any;
    /**
     * Browser event.
     */
    originalEvent?: Event;
}

/**
 * Custom checkbox icon template context.
 * @group Interface
 */
export interface CheckboxIconTemplateContext {
    /**
     * State of the checkbox.
     */
    checked: boolean;
    /**
     * Style class of the icon.
     */
    class: string;
    /**
     * DataP attributes.
     */
    dataP: string;
}

/**
 * Defines valid templates in Checkbox.
 * @group Templates
 */
export interface CheckboxTemplates {
    /**
     * Custom checkbox icon template.
     * @param {Object} context - icon context.
     */
    icon(context: CheckboxIconTemplateContext): TemplateRef<CheckboxIconTemplateContext>;
}

/**
 * Custom pass-through(pt) options.
 * @template I Type of instance.
 *
 * @see {@link CheckboxProps.pt}
 * @group Interface
 */
export interface CheckboxPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLElement, I>;
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
    icon?: PassThroughOption<HTMLElement, I>;
}

/**
 * Defines valid pass-through options in Checkbox.
 * @see {@link CheckboxPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type CheckboxPassThrough<I = unknown> = PassThrough<I, CheckboxPassThroughOptions<I>>;
