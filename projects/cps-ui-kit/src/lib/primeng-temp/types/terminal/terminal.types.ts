// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/types/terminal/terminal.types.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import type { PassThrough, PassThroughOption } from '../../api/public_api';

/**
 * Custom pass-through(pt) options.
 * @template I Type of instance.
 *
 * @see {@link Terminal.pt}
 * @group Interface
 */
export interface TerminalPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the host's DOM element.
     */
    host?: PassThroughOption<HTMLElement, I>;
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the welcome message's DOM element.
     */
    welcomeMessage?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the command list's DOM element.
     */
    commandList?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the command's DOM element.
     */
    command?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the prompt label's DOM element.
     */
    promptLabel?: PassThroughOption<HTMLSpanElement, I>;
    /**
     * Used to pass attributes to the command value's DOM element.
     */
    commandValue?: PassThroughOption<HTMLSpanElement, I>;
    /**
     * Used to pass attributes to the command response's DOM element.
     */
    commandResponse?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the prompt's DOM element.
     */
    prompt?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the prompt value's DOM element.
     */
    promptValue?: PassThroughOption<HTMLInputElement, I>;
}

/**
 * Defines valid pass-through options in Terminal.
 * @see {@link TerminalPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type TerminalPassThrough<I = unknown> = PassThrough<I, TerminalPassThroughOptions<I>>;
