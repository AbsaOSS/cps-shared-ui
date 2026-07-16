// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/api/lazyloadevent.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { FilterMetadata } from './filtermetadata';
import { SortMeta } from './sortmeta';

/**
 * Represents an event object for lazy loading data.
 * @group Interface
 */
export interface LazyLoadEvent {
    /**
     * The index of the first record to be loaded.
     */
    first?: number;
    /**
     * The index of the last record to be loaded.
     */
    last?: number;
    /**
     * The number of rows to load.
     */
    rows?: number;
    /**
     * The field to be used for sorting.
     */
    sortField?: string;
    /**
     * The sort order for the field.
     */
    sortOrder?: number;
    /**
     * An array of sort metadata objects for multiple column sorting.
     */
    multiSortMeta?: SortMeta[];
    /**
     * An object containing filter metadata for filtering the data.
     * The keys represent the field names, and the values represent the corresponding filter metadata.
     */
    filters?: { [s: string]: FilterMetadata };
    /**
     * The global filter value for filtering across all columns.
     */
    globalFilter?: any;
    /**
     * A function that can be called to force an update in the lazy loaded data.
     */
    forceUpdate?: () => void;
}
