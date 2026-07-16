// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/types/tabs/tabs.types.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import type { PassThrough, PassThroughOption } from '../../api/public_api';

/**
 * Defines valid pass-through options in Tabs component.
 * @template I Type of instance.
 *
 * @group Interface
 */
export interface TabsPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLElement, I>;
}

/**
 * Defines valid pass-through options in Tabs component.
 * @see {@link TabsPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type TabsPassThrough<I = unknown> = PassThrough<I, TabsPassThroughOptions<I>>;

/**
 * Defines valid pass-through options in TabList component.
 * @template I Type of instance.
 *
 * @group Interface
 */
export interface TabListPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLElement, I>;
    /**
     * Used to pass attributes to the previous button's DOM element.
     */
    prevButton?: PassThroughOption<HTMLButtonElement, I>;
    /**
     * Used to pass attributes to the content's DOM element.
     */
    content?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the tab list's DOM element.
     */
    tabList?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the active bar's DOM element.
     */
    activeBar?: PassThroughOption<HTMLSpanElement, I>;
    /**
     * Used to pass attributes to the next button's DOM element.
     */
    nextButton?: PassThroughOption<HTMLButtonElement, I>;
}

/**
 * Defines valid pass-through options in TabList component.
 * @see {@link TabListPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type TabListPassThrough<I = unknown> = PassThrough<I, TabListPassThroughOptions<I>>;

/**
 * Defines valid pass-through options in Tab component.
 * @template I Type of instance.
 *
 * @group Interface
 */
export interface TabPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLElement, I>;
}

/**
 * Defines valid pass-through options in Tab component.
 * @see {@link TabPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type TabPassThrough<I = unknown> = PassThrough<I, TabPassThroughOptions<I>>;

/**
 * Defines valid pass-through options in TabPanel component.
 * @template I Type of instance.
 *
 * @group Interface
 */
export interface TabPanelPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLElement, I>;
}

/**
 * Defines valid pass-through options in TabPanel component.
 * @see {@link TabPanelPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type TabPanelPassThrough<I = unknown> = PassThrough<I, TabPanelPassThroughOptions<I>>;

/**
 * Defines valid pass-through options in TabPanels component.
 * @template I Type of instance.
 *
 * @group Interface
 */
export interface TabPanelsPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLElement, I>;
}

/**
 * Defines valid pass-through options in TabPanels component.
 * @see {@link TabPanelsPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type TabPanelsPassThrough<I = unknown> = PassThrough<I, TabPanelsPassThroughOptions<I>>;
