// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/types/menubar/menubar.types.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { TemplateRef } from '@angular/core';
import type { PassThrough, PassThroughOption } from '../../api/public_api';
import { MenuItem } from '../../api/public_api';
import type { BadgePassThrough } from '../badge/public_api';

/**
 * Custom pass-through(pt) options.
 * @template I Type of instance.
 *
 * @see {@link Menubar.pt}
 * @group Interface
 */
export interface MenubarPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the root list's DOM element.
     */
    rootList?: PassThroughOption<HTMLUListElement, I>;
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
    submenuIcon?: PassThroughOption<SVGElement, I>;
    /**
     * Used to pass attributes to the separator's DOM element.
     */
    separator?: PassThroughOption<HTMLLIElement, I>;
    /**
     * Used to pass attributes to the mobile menu button's DOM element.
     */
    button?: PassThroughOption<HTMLAnchorElement, I>;
    /**
     * Used to pass attributes to the mobile menu button icon's DOM element.
     */
    buttonIcon?: PassThroughOption<SVGElement, I>;
    /**
     * Used to pass attributes to the submenu's DOM element.
     */
    submenu?: PassThroughOption<HTMLUListElement, I>;
    /**
     * Used to pass attributes to the start of the component.
     */
    start?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the end of the component.
     */
    end?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to Badge component.
     * @see {@link BadgePassThrough}
     */
    pcBadge?: BadgePassThrough;
}

/**
 * Defines valid pass-through options in Menubar.
 * @see {@link MenubarPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type MenubarPassThrough<I = unknown> = PassThrough<I, MenubarPassThroughOptions<I>>;

/**
 * Custom item template context.
 * @group Interface
 */
export interface MenubarItemTemplateContext {
    /**
     * Menu item instance.
     */
    $implicit: MenuItem;
    /**
     * Whether the item is at the root level.
     */
    root: boolean;
}

/**
 * Defines valid templates in Menubar.
 * @group Templates
 */
export interface MenubarTemplates {
    /**
     * Custom item template.
     * @param {Object} context - item context.
     */
    item(context: MenubarItemTemplateContext): TemplateRef<MenubarItemTemplateContext>;
    /**
     * Custom template of start.
     */
    start(): TemplateRef<void>;
    /**
     * Custom template of end.
     */
    end(): TemplateRef<void>;
    /**
     * Custom template of menu icon.
     */
    menuicon(): TemplateRef<void>;
    /**
     * Custom template of submenu icon.
     */
    submenuicon(): TemplateRef<void>;
}
