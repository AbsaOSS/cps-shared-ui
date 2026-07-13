// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/api/treenode.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
/**
 * Represents a node in a tree data structure.
 * @group Interface
 */
export interface TreeNode<T = any> {
    checked?: boolean;
    /**
     * Label of the node.
     */
    label?: string;
    /**
     * Data represented by the node.
     */
    data?: T;
    /**
     * Icon of the node to display next to content.
     */
    icon?: string;
    /**
     * Icon to use in expanded state.
     */
    expandedIcon?: string;
    /**
     * Icon to use in collapsed state.
     */
    collapsedIcon?: string;
    /**
     * An array of treenodes as children.
     */
    children?: TreeNode<T>[];
    /**
     * Specifies if the node has children. Used in lazy loading.
     * @defaultValue false
     */
    leaf?: boolean;
    /**
     * Expanded state of the node.
     * @defaultValue false
     */
    expanded?: boolean;
    /**
     * Type of the node to match a template.
     */
    type?: string;
    /**
     * Parent of the node.
     */
    parent?: TreeNode<T>;
    /**
     * Defines if value is partially selected.
     */
    partialSelected?: boolean;
    /**
     * Inline style of the node.
     */
    style?: any;
    /**
     * Style class of the node.
     */
    styleClass?: string;
    /**
     * Defines if the node is draggable.
     */
    draggable?: boolean;
    /**
     * Defines if the node is droppable.
     */
    droppable?: boolean;
    /**
     * Whether the node is selectable when selection mode is enabled.
     * @defaultValue false
     */
    selectable?: boolean;
    /**
     * Mandatory unique key of the node.
     */
    key?: string;
    /**
     * Whether the node is loading. Used in lazy loading.
     */
    loading?: boolean;
}
