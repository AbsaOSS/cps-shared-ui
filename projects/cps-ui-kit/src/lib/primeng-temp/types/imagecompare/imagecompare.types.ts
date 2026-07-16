// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/types/imagecompare/imagecompare.types.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { TemplateRef } from '@angular/core';
import type { PassThrough, PassThroughOption } from '../../api/public_api';

/**
 * Custom pass-through(pt) options.
 * @template I Type of instance.
 *
 * @see {@link ImageCompare.pt}
 * @group Interface
 */
export interface ImageComparePassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the slider's DOM element.
     */
    slider?: PassThroughOption<HTMLInputElement, I>;
}

/**
 * Defines valid pass-through options in ImageCompare.
 * @see {@link ImageComparePassThroughOptions}
 *
 * @template I Type of instance.
 */
export type ImageComparePassThrough<I = unknown> = PassThrough<I, ImageComparePassThroughOptions<I>>;

/**
 * Defines valid templates in ImageCompare.
 * @group Templates
 */
export interface ImageCompareTemplates {
    /**
     * Custom left side template.
     */
    left(): TemplateRef<void>;
    /**
     * Custom right side template.
     */
    right(): TemplateRef<void>;
}
