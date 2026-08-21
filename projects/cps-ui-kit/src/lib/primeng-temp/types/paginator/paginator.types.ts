// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/types/paginator/paginator.types.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { TemplateRef } from '@angular/core';
import type { PassThrough, PassThroughOption } from '../../api/public_api';
import { InputNumberPassThrough } from '../inputnumber/public_api';
import { SelectPassThrough } from '../select/public_api';

/**
 * Custom pass-through(pt) options.
 * @template I Type of instance.
 *
 * @see {@link Paginator.pt}
 * @group Interface
 */
export interface PaginatorPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the host's DOM element.
     */
    host?: PassThroughOption<HTMLElement, I>;
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the content start's DOM element.
     */
    contentStart?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the current page report's DOM element.
     */
    current?: PassThroughOption<HTMLSpanElement, I>;
    /**
     * Used to pass attributes to the first page button's DOM element.
     */
    first?: PassThroughOption<HTMLButtonElement, I>;
    /**
     * Used to pass attributes to the first page button icon's DOM element.
     */
    firstIcon?: PassThroughOption<SVGElement, I>;
    /**
     * Used to pass attributes to the previous page button's DOM element.
     */
    prev?: PassThroughOption<HTMLButtonElement, I>;
    /**
     * Used to pass attributes to the previous page button icon's DOM element.
     */
    prevIcon?: PassThroughOption<SVGElement, I>;
    /**
     * Used to pass attributes to the pages container's DOM element.
     */
    pages?: PassThroughOption<HTMLSpanElement, I>;
    /**
     * Used to pass attributes to the page button's DOM element.
     */
    page?: PassThroughOption<HTMLButtonElement, I>;
    /**
     * Used to pass attributes to the next page button's DOM element.
     */
    next?: PassThroughOption<HTMLButtonElement, I>;
    /**
     * Used to pass attributes to the next page button icon's DOM element.
     */
    nextIcon?: PassThroughOption<SVGElement, I>;
    /**
     * Used to pass attributes to the last page button's DOM element.
     */
    last?: PassThroughOption<HTMLButtonElement, I>;
    /**
     * Used to pass attributes to the last page button icon's DOM element.
     */
    lastIcon?: PassThroughOption<SVGElement, I>;
    /**
     * Used to pass attributes to the content end's DOM element.
     */
    contentEnd?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the Select component (jump to page dropdown).
     */
    pcJumpToPageDropdown?: SelectPassThrough;
    /**
     * Used to pass attributes to the InputNumber component (jump to page input).
     */
    pcJumpToPageInput?: InputNumberPassThrough;
    /**
     * Used to pass attributes to the Select component (rows per page dropdown).
     */
    pcRowPerPageDropdown?: SelectPassThrough;
}

/**
 * Defines valid pass-through options in Paginator.
 * @see {@link PaginatorPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type PaginatorPassThrough<I = unknown> = PassThrough<I, PaginatorPassThroughOptions<I>>;

/**
 * Paginator state.
 * @group Interface
 */
export interface PaginatorState {
    /**
     * Current page number.
     */
    page?: number;
    /**
     * Index of the first record.
     */
    first?: number;
    /**
     * Number of rows per page.
     */
    rows?: number;
    /**
     * Total number of pages.
     */
    pageCount?: number;
    /**
     * Total number of records.
     */
    totalRecords?: number;
}

/**
 * Custom template context for left/right templates.
 * @group Interface
 */
export interface PaginatorTemplateContext {
    /**
     * Paginator state.
     */
    $implicit: PaginatorState;
}

/**
 * Custom template context for dropdown item templates.
 * @group Interface
 */
export interface PaginatorDropdownItemTemplateContext {
    /**
     * Dropdown item instance.
     */
    $implicit: any;
}

/**
 * Defines valid templates in PaginatorTemplates.
 * @group Templates
 */
export interface PaginatorTemplates {
    /**
     * Custom dropdown trigger icon template.
     */
    dropdownicon(): TemplateRef<void>;
    /**
     * Custom first page link icon template.
     */
    firstpagelinkicon(): TemplateRef<void>;
    /**
     * Custom previous page link icon template.
     */
    previouspagelinkicon(): TemplateRef<void>;
    /**
     * Custom last page link icon template.
     */
    lastpagelinkicon(): TemplateRef<void>;
    /**
     * Custom next page link icon template.
     */
    nextpagelinkicon(): TemplateRef<void>;
}
