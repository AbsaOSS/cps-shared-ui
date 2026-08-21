// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/types/progressbar/progressbar.types.ts
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
 * @see {@link ProgressBar.pt}
 * @group Interface
 */
export interface ProgressBarPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the host's DOM element.
     */
    host?: PassThroughOption<HTMLElement, I>;
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the value's DOM element.
     */
    value?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the label's DOM element.
     */
    label?: PassThroughOption<HTMLDivElement, I>;
}

/**
 * Defines valid pass-through options in ProgressBar.
 * @see {@link ProgressBarPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type ProgressBarPassThrough<I = unknown> = PassThrough<I, ProgressBarPassThroughOptions<I>>;

/**
 * Custom content template context.
 * @group Interface
 */
export interface ProgressBarContentTemplateContext {
    /**
     * Value of the progressbar.
     */
    $implicit: number | undefined;
}

/**
 * Defines valid templates in ProgressBar.
 * @group Templates
 */
export interface ProgressBarTemplates {
    /**
     * Custom template of content.
     * @param {ProgressBarContentTemplateContext} context - content context.
     */
    content(context: ProgressBarContentTemplateContext): TemplateRef<ProgressBarContentTemplateContext>;
}
