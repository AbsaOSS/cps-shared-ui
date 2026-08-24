// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/api/filtermatchmode.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
export class FilterMatchMode {
    public static readonly STARTS_WITH = 'startsWith';
    public static readonly CONTAINS = 'contains';
    public static readonly NOT_CONTAINS = 'notContains';
    public static readonly ENDS_WITH = 'endsWith';
    public static readonly EQUALS = 'equals';
    public static readonly NOT_EQUALS = 'notEquals';
    public static readonly IN = 'in';
    public static readonly LESS_THAN = 'lt';
    public static readonly LESS_THAN_OR_EQUAL_TO = 'lte';
    public static readonly GREATER_THAN = 'gt';
    public static readonly GREATER_THAN_OR_EQUAL_TO = 'gte';
    public static readonly BETWEEN = 'between';
    public static readonly IS = 'is';
    public static readonly IS_NOT = 'isNot';
    public static readonly BEFORE = 'before';
    public static readonly AFTER = 'after';
    public static readonly DATE_IS = 'dateIs';
    public static readonly DATE_IS_NOT = 'dateIsNot';
    public static readonly DATE_BEFORE = 'dateBefore';
    public static readonly DATE_AFTER = 'dateAfter';
}
