// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/types/orderlist/orderlist.types.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { TemplateRef } from '@angular/core';
import type { PassThrough, PassThroughOption } from '../../api/public_api';
import type { ButtonPassThrough } from '../button/public_api';
import type { ListBoxPassThrough } from '../listbox/public_api';

/**
 * Custom pass-through(pt) options.
 * @template I Type of instance.
 *
 * @see {@link OrderList.pt}
 * @group Interface
 */
export interface OrderListPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the host's DOM element.
     */
    host?: PassThroughOption<HTMLElement, I>;
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the controls container's DOM element.
     */
    controls?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the move up button's DOM element.
     */
    pcMoveUpButton?: ButtonPassThrough;
    /**
     * Used to pass attributes to the move top button's DOM element.
     */
    pcMoveTopButton?: ButtonPassThrough;
    /**
     * Used to pass attributes to the move down button's DOM element.
     */
    pcMoveDownButton?: ButtonPassThrough;
    /**
     * Used to pass attributes to the move bottom button's DOM element.
     */
    pcMoveBottomButton?: ButtonPassThrough;
    /**
     * Used to pass attributes to the Listbox component.
     */
    pcListbox?: ListBoxPassThrough;
}

/**
 * Defines valid pass-through options in OrderList.
 * @see {@link OrderListPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type OrderListPassThrough<I = unknown> = PassThrough<I, OrderListPassThroughOptions<I>>;

/**
 * Callbacks to invoke on filter.
 * @group Interface
 */
export interface OrderListFilterOptions {
    filter?: (value?: any) => void;
    reset?: () => void;
}

/**
 * Custom change event.
 * @see {@link OrderList.selectionChange}
 * @group Events
 */
export interface OrderListSelectionChangeEvent {
    /**
     * Browser event.
     */
    originalEvent: Event;
    /**
     * Current selected values.
     */
    value: any[];
}

/**
 * Custom change event.
 * @see {@link OrderList.selectionChange}
 * @group Events
 */
export interface OrderListFilterEvent {
    /**
     * Browser event.
     */
    originalEvent: Event;
    /**
     * Filtered options.
     */
    value: any[];
}

/**
 * Custom item template context.
 * @group Interface
 */
export interface OrderListItemTemplateContext {
    /**
     * Item instance.
     */
    $implicit: any;
    /**
     * Whether the item is selected.
     */
    selected: boolean;
    /**
     * Index of the item.
     */
    index: number;
}

/**
 * Custom filter template context.
 * @group Interface
 */
export interface OrderListFilterTemplateContext {
    /**
     * Filter options.
     */
    options: OrderListFilterOptions;
}

/**
 * Defines valid templates in OrderList.
 * @group Templates
 */
export interface OrderListTemplates {
    /**
     * Custom item template.
     * @param {OrderListItemTemplateContext} context - item context.
     */
    item(context: OrderListItemTemplateContext): TemplateRef<OrderListItemTemplateContext>;
    /**
     * Custom header template.
     */
    header(): TemplateRef<void>;
    /**
     * Custom filter template.
     * @param {OrderListFilterTemplateContext} context - filter context.
     */
    filter(context: OrderListFilterTemplateContext): TemplateRef<OrderListFilterTemplateContext>;
    /**
     * Custom empty filter template.
     */
    emptyfilter(): TemplateRef<void>;
    /**
     * Custom empty template.
     */
    empty(): TemplateRef<void>;
    /**
     * Custom clear icon template.
     */
    clearicon(): TemplateRef<void>;
    /**
     * Custom filter icon template.
     */
    filtericon(): TemplateRef<void>;
    /**
     * Custom move up icon template.
     */
    moveupicon(): TemplateRef<void>;
    /**
     * Custom move top icon template.
     */
    movetopicon(): TemplateRef<void>;
    /**
     * Custom move down icon template.
     */
    movedownicon(): TemplateRef<void>;
    /**
     * Custom move bottom icon template.
     */
    movebottomicon(): TemplateRef<void>;
}
