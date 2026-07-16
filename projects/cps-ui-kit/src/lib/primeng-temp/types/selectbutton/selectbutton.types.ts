// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/types/selectbutton/selectbutton.types.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { TemplateRef } from '@angular/core';
import type { PassThrough, PassThroughOption } from '../../api/public_api';
import type { ToggleButtonPassThrough } from '../togglebutton/public_api';

/**
 * Custom pass-through(pt) options.
 * @template I Type of instance.
 *
 * @see {@link SelectButton.pt}
 * @group Interface
 */
export interface SelectButtonPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the host's DOM element.
     */
    host?: PassThroughOption<HTMLElement, I>;
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the ToggleButton component.
     * @see {@link ToggleButtonPassThrough}
     */
    pcToggleButton?: ToggleButtonPassThrough;
}

/**
 * Custom passthrough attributes for each DOM elements
 * @group Interface
 */
export type SelectButtonPassThrough<I = unknown> = PassThrough<I, SelectButtonPassThroughOptions<I>>;

/**
 * Custom change event.
 * @see {@link SelectButton.onChange}
 * @group Events
 */
export interface SelectButtonChangeEvent {
    /**
     * Browser event.
     */
    originalEvent?: Event;
    /**
     * Selected option.
     */
    value?: any;
}

/**
 * Custom option click event.
 * @see {@link SelectButton.onOptionClick}
 * @group Events
 */
export interface SelectButtonOptionClickEvent {
    /**
     * Browser event.
     */
    originalEvent?: Event;
    /**
     * Selected option.
     */
    option?: any;
    /**
     * Index of the selected option.
     */
    index?: number;
}

/**
 * Custom item template context.
 * @group Interface
 */
export interface SelectButtonItemTemplateContext {
    /**
     * Option instance.
     */
    $implicit: any;
    /**
     * Index of the option.
     */
    index: number;
}

/**
 * Defines valid templates in SelectButton.
 * @group Templates
 */
export interface SelectButtonTemplates {
    /**
     * Custom item template.
     * @param {SelectButtonItemTemplateContext} context - item context.
     */
    item(context: SelectButtonItemTemplateContext): TemplateRef<SelectButtonItemTemplateContext>;
}
