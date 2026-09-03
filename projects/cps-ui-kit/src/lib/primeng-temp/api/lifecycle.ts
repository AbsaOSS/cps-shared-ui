// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/api/lifecycle.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import type { AfterContentChecked, AfterContentInit, AfterViewChecked, AfterViewInit, DoCheck, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';

export interface Lifecycle {
    /**
     * Simulates Angular's ngOnInit hook.
     * @see {@link OnInit#ngOnInit}
     */
    onInit(): void;
    /**
     * Simulates Angular's ngOnChanges hook.
     * @see {@link OnChanges#ngOnChanges}
     */
    onChanges(changes: SimpleChanges): void;
    /**
     * Simulates Angular's ngDoCheck hook.
     * @see {@link DoCheck#ngDoCheck}
     */
    onDoCheck(): void;
    /**
     * Simulates Angular's ngOnDestroy hook.
     * @see {@link OnDestroy#ngOnDestroy}
     */
    onDestroy(): void;
    /**
     * Simulates Angular's ngAfterContentInit hook.
     * @see {@link AfterContentInit#ngAfterContentInit}
     */
    onAfterContentInit(): void;
    /**
     * Simulates Angular's ngAfterContentChecked hook.
     * @see {@link AfterContentChecked#ngAfterContentChecked}
     */
    onAfterContentChecked(): void;
    /**
     * Simulates Angular's ngAfterViewInit hook.
     * @see {@link AfterViewInit#ngAfterViewInit}
     */
    onAfterViewInit(): void;
    /**
     * Simulates Angular's ngAfterViewChecked hook.
     * @see {@link AfterViewChecked#ngAfterViewChecked}
     */
    onAfterViewChecked(): void;
}

export interface LifecycleHooks extends Partial<Lifecycle> {
    /**
     * Defines a function to be called before the component's initialization (constructor phase).
     */
    onBeforeInit?(): void;
}
