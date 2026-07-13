// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/api/treenodedragevent.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { TreeNode } from './treenode';

/**
 * Represents the event data for a tree node drag operation.
 * @group Interface
 */
export interface TreeNodeDragEvent {
    /**
     * Tree instance.
     */
    tree?: any;
    /**
     * Node to be dragged.
     */
    node?: TreeNode<any>;
    /**
     * Child nodes of dragged node.
     */
    subNodes?: TreeNode<any>[];
    /**
     * Index of dragged node.
     */
    index?: number;
    /**
     * Scope of dragged node.
     */
    scope?: any;
}
