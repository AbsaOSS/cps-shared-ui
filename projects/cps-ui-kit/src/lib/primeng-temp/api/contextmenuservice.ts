// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/api/contextmenuservice.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { Injectable } from '@angular/core';
import { Nullable } from '../ts-helpers/public_api';
import { Subject } from 'rxjs';

@Injectable()
export class ContextMenuService {
    private activeItemKeyChange = new Subject<string>();

    activeItemKeyChange$ = this.activeItemKeyChange.asObservable();

    activeItemKey: Nullable<string>;

    changeKey(key: string) {
        this.activeItemKey = key;
        this.activeItemKeyChange.next(this.activeItemKey as string);
    }

    reset() {
        this.activeItemKey = null;
        this.activeItemKeyChange.next(this.activeItemKey as any);
    }
}
