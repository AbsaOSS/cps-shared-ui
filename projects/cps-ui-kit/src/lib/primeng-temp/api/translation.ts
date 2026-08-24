// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/api/translation.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
/**
 * Represents a set of translated strings used in a component or application.
 * @group Interface
 */
export interface Translation {
    startsWith?: string;
    contains?: string;
    notContains?: string;
    endsWith?: string;
    equals?: string;
    completed?: string;
    notEquals?: string;
    noFilter?: string;
    lt?: string;
    lte?: string;
    gt?: string;
    gte?: string;
    is?: string;
    isNot?: string;
    before?: string;
    after?: string;
    dateIs?: string;
    dateIsNot?: string;
    dateBefore?: string;
    dateAfter?: string;
    clear?: string;
    apply?: string;
    matchAll?: string;
    matchAny?: string;
    addRule?: string;
    removeRule?: string;
    accept?: string;
    reject?: string;
    choose?: string;
    upload?: string;
    cancel?: string;
    fileSizeTypes?: string[];
    dayNames?: string[];
    dayNamesShort?: string[];
    dayNamesMin?: string[];
    monthNames?: string[];
    monthNamesShort?: string[];
    dateFormat?: string;
    firstDayOfWeek?: number;
    today?: string;
    weekHeader?: string;
    weak?: string;
    medium?: string;
    strong?: string;
    passwordPrompt?: string;
    emptyMessage?: string;
    emptyFilterMessage?: string;
    fileChosenMessage?: string;
    noFileChosenMessage?: string;
    pending?: string;
    chooseYear?: string;
    chooseMonth?: string;
    chooseDate?: string;
    prevDecade?: string;
    nextDecade?: string;
    prevYear?: string;
    nextYear?: string;
    prevMonth?: string;
    nextMonth?: string;
    prevHour?: string;
    nextHour?: string;
    prevMinute?: string;
    nextMinute?: string;
    prevSecond?: string;
    nextSecond?: string;
    am?: string;
    pm?: string;
    searchMessage?: string;
    selectionMessage?: string;
    emptySelectionMessage?: string;
    emptySearchMessage?: string;
    aria?: Aria;
}
/**
 * Represents a set of translated HTML attributes used in a component or application.
 * @group Interface
 */
export interface Aria {
    trueLabel?: string;
    falseLabel?: string;
    nullLabel?: string;
    star?: string;
    stars?: string;
    selectAll?: string;
    unselectAll?: string;
    close?: string;
    previous?: string;
    next?: string;
    navigation?: string;
    scrollTop?: string;
    moveTop?: string;
    moveUp?: string;
    moveDown?: string;
    moveBottom?: string;
    moveToTarget?: string;
    moveToSource?: string;
    moveAllToTarget?: string;
    moveAllToSource?: string;
    pageLabel?: string;
    firstPageLabel?: string;
    lastPageLabel?: string;
    nextPageLabel?: string;
    prevPageLabel?: string;
    rowsPerPageLabel?: string;
    previousPageLabel?: string;
    jumpToPageDropdownLabel?: string;
    jumpToPageInputLabel?: string;
    selectRow?: string;
    unselectRow?: string;
    expandRow?: string;
    collapseRow?: string;
    showFilterMenu?: string;
    hideFilterMenu?: string;
    filterOperator?: string;
    filterConstraint?: string;
    editRow?: string;
    saveEdit?: string;
    cancelEdit?: string;
    listView?: string;
    gridView?: string;
    slide?: string;
    slideNumber?: string;
    zoomImage?: string;
    zoomIn?: string;
    zoomOut?: string;
    rotateRight?: string;
    rotateLeft?: string;
    listLabel?: string;
    selectColor?: string;
    removeLabel?: string;
    browseFiles?: string;
    maximizeLabel?: string;
    minimizeLabel?: string;
}
