// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/types/blockui/blockui.types.ts
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
 * @see {@link BlockUI.pt}
 * @group Interface
 */
export interface BlockUIPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the host's DOM element.
     */
    host?: PassThroughOption<HTMLElement, I>;
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLDivElement, I>;
}

/**
 * Defines valid pass-through options in BlockUI component.
 * @see {@link BlockUIPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type BlockUIPassThrough<I = unknown> = PassThrough<I, BlockUIPassThroughOptions<I>>;

/**
 * Defines valid templates in BlockUI.
 * @group Templates
 */
export interface BlockUITemplates {
    /**
     * Custom template of content.
     */
    content(): TemplateRef<any>;
}
