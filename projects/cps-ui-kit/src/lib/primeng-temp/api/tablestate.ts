// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/api/tablestate.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { FilterMetadata } from './filtermetadata';
import { SortMeta } from './sortmeta';

/**
 * Represents the state of a table component.
 * @group Interface
 */
export interface TableState {
    /**
     * The index of the first row to be displayed.
     */
    first?: number;
    /**
     * The number of rows to be displayed per page.
     */
    rows?: number;
    /**
     * The field used for sorting.
     */
    sortField?: string;
    /**
     * The sort order.
     */
    sortOrder?: number;
    /**
     * An array of sort metadata when multiple sorting is applied.
     */
    multiSortMeta?: SortMeta[];
    /**
     * The filters to be applied to the table.
     */
    filters?: { [s: string]: FilterMetadata | FilterMetadata[] };
    /**
     * The column widths for the table.
     */
    columnWidths?: string;
    /**
     * The width of the table.
     */
    tableWidth?: string;
    /**
     * The width of the wrapper element containing the table.
     */
    wrapperWidth?: string;
    /**
     * The selected item(s) in the table.
     */
    selection?: any;
    /**
     * The order of the columns in the table.
     */
    columnOrder?: string[];
    /**
     * The keys of the expanded rows in the table.
     */
    expandedRowKeys?: { [s: string]: boolean };
}
