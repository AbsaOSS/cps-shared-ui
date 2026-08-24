// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/api/passthrough.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import type { LifecycleHooks } from './lifecycle';

/**
 * Defines the pass-through options.
 */
export interface PassThroughOptions {
    /**
     * Defines whether the props should be merged.
     * @default false
     */
    mergeProps?: boolean | ((global: unknown, self: unknown, datasets?: unknown) => unknown);
    /**
     * Defines whether the sections should be merged.
     * @default true
     */
    mergeSections?: boolean | undefined;
}

/**
 * Defines the pass-through method options.
 * @template I Type of instance.
 * @template PI Type of parent instance.
 */
export interface PassThroughContext<I = unknown, PI = unknown> {
    /**
     * Defines instance.
     */
    instance: I;
    /**
     * Defines parent options.
     */
    parent: {
        instance: PI;
    };
    /**
     * Defines passthrough(pt) options in global config.
     */
    global?: Record<PropertyKey, unknown> | undefined;
}

export interface CommonPassThrough {
    /**
     * Used to manage all lifecycle hooks.
     */
    hooks?: LifecycleHooks;
}

type HTMLElementProps<T> = {
    [K in keyof T as T[K] extends Function ? never : K]?: T[K];
};

type OnGlobalEventHandlers = {
    [K in keyof GlobalEventHandlers as K extends `on${infer Rest}` ? `on${Rest}` : never]?: GlobalEventHandlers[K];
};

type PassThroughAttributes<E> = Omit<HTMLElementProps<E>, 'style'> &
    OnGlobalEventHandlers & {
        [key: string]: any;
    } & {
        style?: Partial<CSSStyleDeclaration> | undefined;
    };

export declare type PassThroughOption<E = HTMLElement, I = unknown, PI = unknown> = PassThroughAttributes<E> | ((options: PassThroughContext<I, PI>) => PassThroughAttributes<E> | string) | string | null | undefined;

type AllPassThrough<O> = O & CommonPassThrough;

export declare type PassThrough<I = unknown, O = unknown> = AllPassThrough<O> | ((context: PassThroughContext<I>) => AllPassThrough<O>) | null | undefined;
