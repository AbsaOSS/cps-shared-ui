// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/types/megamenu/megamenu.types.ts
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
 * @see {@link MegaMenu.pt}
 * @group Interface
 */
export interface MegaMenuPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the start's DOM element.
     */
    start?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the button's DOM element.
     */
    button?: PassThroughOption<HTMLAnchorElement, I>;
    /**
     * Used to pass attributes to the button icon's DOM element.
     */
    buttonIcon?: PassThroughOption<HTMLElement, I>;
    /**
     * Used to pass attributes to the root list's DOM element.
     */
    rootList?: PassThroughOption<HTMLUListElement, I>;
    /**
     * Used to pass attributes to the submenu label's DOM element.
     */
    submenuLabel?: PassThroughOption<HTMLLIElement, I>;
    /**
     * Used to pass attributes to the separator's DOM element.
     */
    separator?: PassThroughOption<HTMLLIElement, I>;
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
    /**
     * Used to pass attributes to the item label's DOM element.
     */
    itemLabel?: PassThroughOption<HTMLSpanElement, I>;
    /**
     * Used to pass attributes to the submenu icon's DOM element.
     */
    submenuIcon?: PassThroughOption<HTMLElement, I>;
    /**
     * Used to pass attributes to the overlay's DOM element.
     */
    overlay?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the grid's DOM element.
     */
    grid?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the column's DOM element.
     */
    column?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the submenu's DOM element.
     */
    submenu?: PassThroughOption<HTMLUListElement, I>;
    /**
     * Used to pass attributes to the end's DOM element.
     */
    end?: PassThroughOption<HTMLDivElement, I>;
}

/**
 * Defines valid pass-through options in MegaMenu.
 * @see {@link MegaMenuPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type MegaMenuPassThrough<I = unknown> = PassThrough<I, MegaMenuPassThroughOptions<I>>;

/**
 * Custom item template context.
 * @group Interface
 */
export interface MegaMenuItemTemplateContext {
    /**
     * Menu item instance.
     */
    $implicit: MenuItem;
}

/**
 * Defines valid templates in MegaMenu.
 * @group Templates
 */
export interface MegaMenuTemplates {
    /**
     * Custom item template.
     * @param {Object} context - item context.
     */
    item(context: MegaMenuItemTemplateContext): TemplateRef<MegaMenuItemTemplateContext>;
    /**
     * Custom template of start.
     */
    start(): TemplateRef<void>;
    /**
     * Custom template of end.
     */
    end(): TemplateRef<void>;
    /**
     * Custom template of submenu icon.
     */
    submenuicon(): TemplateRef<void>;
    /**
     * Custom menu button template on responsive mode.
     */
    button(): TemplateRef<void>;
    /**
     * Custom menu button icon template on responsive mode.
     */
    buttonicon(): TemplateRef<void>;
    /**
     * Custom menu icon template.
     */
    menuicon(): TemplateRef<void>;
}
