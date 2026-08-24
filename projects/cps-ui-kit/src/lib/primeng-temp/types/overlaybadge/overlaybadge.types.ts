// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/types/overlaybadge/overlaybadge.types.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import type { BadgePassThrough } from '../badge/public_api';
import type { PassThrough, PassThroughOption } from '../../api/public_api';

/**
 * Custom pass-through(pt) options.
 * @template I Type of instance.
 *
 * @see {@link OverlayBadgeProps.pt}
 * @group Interface
 */
export interface OverlayBadgePassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the host's DOM element.
     */
    host?: PassThroughOption<HTMLElement, I>;
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the Badge component.
     * @see {@link BadgePassThrough}
     */
    pcBadge?: BadgePassThrough;
}

/**
 * Defines valid pass-through options in OverlayBadge.
 * @see {@link OverlayBadgePassThroughOptions}
 *
 * @template I Type of instance.
 */
export type OverlayBadgePassThrough<I = unknown> = PassThrough<I, OverlayBadgePassThroughOptions<I>>;
