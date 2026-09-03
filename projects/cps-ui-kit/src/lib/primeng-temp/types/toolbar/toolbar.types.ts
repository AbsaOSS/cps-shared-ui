// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/types/toolbar/toolbar.types.ts
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
 * @see {@link Toolbar.pt}
 * @group Interface
 */
export interface ToolbarPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLElement, I>;
    /**
     * Used to pass attributes to the start's DOM element.
     */
    start?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the center's DOM element.
     */
    center?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the right's DOM element.
     */
    end?: PassThroughOption<HTMLDivElement, I>;
}

/**
 * Defines valid pass-through options in Toolbar component.
 * @see {@link ToolbarPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type ToolbarPassThrough<I = unknown> = PassThrough<I, ToolbarPassThroughOptions<I>>;

/**
 * Defines valid templates in Toolbar.
 * @group Templates
 */
export interface ToolbarTemplates {
    /**
     * Custom start template.
     */
    start(): TemplateRef<void>;
    /**
     * Custom end template.
     */
    end(): TemplateRef<void>;
    /**
     * Custom center template.
     */
    center(): TemplateRef<void>;
}
