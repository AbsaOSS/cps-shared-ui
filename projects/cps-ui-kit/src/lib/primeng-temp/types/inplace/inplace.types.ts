// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/types/inplace/inplace.types.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { TemplateRef } from '@angular/core';
import type { PassThrough, PassThroughOption } from '../../api/public_api';
import type { ButtonPassThrough } from '../button/public_api';

/**
 * Custom pass-through(pt) options.
 * @template I Type of instance.
 *
 * @see {@link Inplace.pt}
 * @group Interface
 */
export interface InplacePassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the host's DOM element.
     */
    host?: PassThroughOption<HTMLElement, I>;
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the display's DOM element.
     */
    display?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the content's DOM element.
     */
    content?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the Button component.
     * @see {@link ButtonPassThrough}
     */
    pcButton?: ButtonPassThrough;
}

/**
 * Defines valid pass-through options in Inplace.
 * @see {@link InplacePassThroughOptions}
 *
 * @template I Type of instance.
 */
export type InplacePassThrough<I = unknown> = PassThrough<I, InplacePassThroughOptions<I>>;

/**
 * Custom content template context.
 * @group Interface
 */
export interface InplaceContentTemplateContext {
    /**
     * Callback to invoke to close the inplace content.
     */
    closeCallback: (event: MouseEvent) => void;
}

/**
 * Defines valid templates in Inplace.
 * @group Templates
 */
export interface InplaceTemplates {
    /**
     * Custom display template.
     */
    display(): TemplateRef<void>;
    /**
     * Custom content template.
     * @param {Object} context - content context.
     */
    content(context: InplaceContentTemplateContext): TemplateRef<InplaceContentTemplateContext>;
    /**
     * Custom close icon template.
     */
    closeicon(): TemplateRef<void>;
}
