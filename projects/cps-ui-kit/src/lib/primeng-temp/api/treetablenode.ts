// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/api/treetablenode.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { TreeNode } from './treenode';

/**
 * Tree table node element.
 * @extends {TreeNode}
 * @group Interface
 */
export interface TreeTableNode<T = any> extends TreeNode {
    /**
     * Browser event.
     */
    originalEvent?: Event;
    /**
     * Row of the node.
     */
    rowNode?: any;
    /**
     * Node instance.
     */
    node?: TreeNode<T>;
    /**
     * Selection type.
     */
    type?: string;
    /**
     * Node index.
     */
    index?: number;
    /**
     * Node level.
     */
    level?: number;
    /**
     * Boolean value indicates if node is in viewport.
     */
    visible?: boolean;
}
