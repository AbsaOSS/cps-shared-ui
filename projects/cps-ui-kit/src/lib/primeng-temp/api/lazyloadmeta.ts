// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/api/lazyloadmeta.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { FilterMetadata } from './filtermetadata';
import { SortMeta } from './sortmeta';
/**
 * Meta data for lazy load event.
 * @group Interface
 */
export interface LazyLoadMeta {
    first?: number | undefined | null;
    rows?: number | undefined | null;
    sortField?: string | string[] | null | undefined;
    sortOrder?: number | undefined | null;
    filters?: { [s: string]: FilterMetadata | FilterMetadata[] | undefined };
    globalFilter?: string | string[] | undefined | null;
    multiSortMeta?: SortMeta[] | undefined | null;
    forceUpdate?: Function;
    last?: number | undefined | null;
}
