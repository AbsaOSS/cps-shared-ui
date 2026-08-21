// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/types/organizationchart/organizationchart.types.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { TemplateRef } from '@angular/core';
import type { PassThrough, PassThroughOption } from '../../api/public_api';
import { TreeNode } from '../../api/public_api';

/**
 * Custom pass-through(pt) options.
 * @template I Type of instance.
 *
 * @see {@link OrganizationChart.pt}
 * @group Interface
 */
export interface OrganizationChartPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the table's DOM element.
     */
    table?: PassThroughOption<HTMLTableElement, I>;
    /**
     * Used to pass attributes to the body's DOM element.
     */
    body?: PassThroughOption<HTMLTableSectionElement, I>;
    /**
     * Used to pass attributes to the row's DOM element.
     */
    row?: PassThroughOption<HTMLTableRowElement, I>;
    /**
     * Used to pass attributes to the cell's DOM element.
     */
    cell?: PassThroughOption<HTMLTableCellElement, I>;
    /**
     * Used to pass attributes to the node's DOM element.
     */
    node?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the node toggle button's DOM element.
     */
    nodeToggleButton?: PassThroughOption<HTMLAnchorElement, I>;
    /**
     * Used to pass attributes to the node toggle button icon's DOM element.
     */
    nodeToggleButtonIcon?: PassThroughOption<HTMLElement, I>;
    /**
     * Used to pass attributes to the connectors' DOM element.
     */
    connectors?: PassThroughOption<HTMLTableRowElement, I>;
    /**
     * Used to pass attributes to the line cell's DOM element.
     */
    lineCell?: PassThroughOption<HTMLTableCellElement, I>;
    /**
     * Used to pass attributes to the connector down's DOM element.
     */
    connectorDown?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the connector left's DOM element.
     */
    connectorLeft?: PassThroughOption<HTMLTableCellElement, I>;
    /**
     * Used to pass attributes to the connector right's DOM element.
     */
    connectorRight?: PassThroughOption<HTMLTableCellElement, I>;
    /**
     * Used to pass attributes to the node children's DOM element.
     */
    nodeChildren?: PassThroughOption<HTMLTableRowElement, I>;
    /**
     * Used to pass attributes to the node cell's DOM element.
     */
    nodeCell?: PassThroughOption<HTMLTableCellElement, I>;
}

/**
 * Defines valid pass-through options in OrganizationChart.
 * @see {@link OrganizationChartPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type OrganizationChartPassThrough<I = unknown> = PassThrough<I, OrganizationChartPassThroughOptions<I>>;

/**
 * Custom node select event.
 * @see {@link OrganizationChart.onNodeSelect}
 * @group Events
 */
export interface OrganizationChartNodeSelectEvent {
    /**
     * Browser event.
     */
    originalEvent: Event;
    /**
     * Node instance.
     */
    node: TreeNode;
}
/**
 * Custom node unselect event.
 * @see {@link OrganizationChart.onNodeUnSelect}
 * @extends {OrganizationChartNodeSelectEvent}
 * @group Events
 */
export interface OrganizationChartNodeUnSelectEvent extends OrganizationChartNodeSelectEvent {}
/**
 * Custom node expand event.
 * @see {@link OrganizationChart.onNodeExpand}
 * @extends {OrganizationChartNodeSelectEvent}
 * @group Events
 */
export interface OrganizationChartNodeExpandEvent extends OrganizationChartNodeSelectEvent {}
/**
 * Custom node collapse event.
 * @see {@link OrganizationChart.onNodeCollapse}
 * @extends {OrganizationChartNodeSelectEvent}
 * @group Events
 */
export interface OrganizationChartNodeCollapseEvent extends OrganizationChartNodeSelectEvent {}
/**
 * Defines valid templates in OrganizationChart.
 * @group Templates
 */
export interface OrganizationChartTemplates {
    /**
     * Custom toggler icon template.
     * @param {Object} context - item data.
     */
    togglericon(context: {
        /**
         * Expanded state of the node.
         */
        $implicit: boolean;
    }): TemplateRef<{ $implicit: boolean }>;
}
