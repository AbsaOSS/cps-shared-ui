// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/types/dock/dock.types.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { TemplateRef } from '@angular/core';
import type { MenuItem, PassThrough, PassThroughOption } from '../../api/public_api';

/**
 * Custom pass-through(pt) options.
 * @template I Type of instance.
 *
 * @see {@link Dock.pt}
 * @group Interface
 */
export interface DockPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLElement, I>;
    /**
     * Used to pass attributes to the list container's DOM element.
     */
    listContainer?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the list's DOM element.
     */
    list?: PassThroughOption<HTMLUListElement, I>;
    /**
     * Used to pass attributes to the item's DOM element.
     */
    item?: PassThroughOption<HTMLLIElement, I>;
    /**
     * Used to pass attributes to the item content's DOM element.
     */
    itemContent?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the item link's DOM element.
     */
    itemLink?: PassThroughOption<HTMLAnchorElement, I>;
    /**
     * Used to pass attributes to the item icon's DOM element.
     */
    itemIcon?: PassThroughOption<HTMLSpanElement, I>;
}

/**
 * Defines valid pass-through options in Dock.
 * @see {@link DockPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type DockPassThrough<I = unknown> = PassThrough<I, DockPassThroughOptions<I>>;

/**
 * Custom item template context.
 * @group Interface
 */
export interface DockItemTemplateContext {
    /**
     * Menu item instance.
     */
    $implicit: MenuItem;
}

/**
 * Defines valid templates in Dock.
 * @group Templates
 */
export interface DockTemplates {
    /**
     * Custom template of item.
     * @param {Object} context - item data.
     */
    item(context: DockItemTemplateContext): TemplateRef<DockItemTemplateContext>;
}
