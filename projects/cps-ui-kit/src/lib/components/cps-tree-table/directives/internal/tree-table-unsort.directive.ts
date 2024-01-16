import { Directive, Host, Self, Optional } from '@angular/core';
import { TreeTable } from 'primeng/treetable';
import { ObjectUtils } from 'primeng/utils';

@Directive({
  standalone: true,
  selector: '[ttWithUnsort]'
})
export class TreeTableUnsortDirective {
  defaultSortOrderInitialized = false;

  constructor(@Host() @Self() @Optional() public pTreeTable: TreeTable) {
    pTreeTable.tableService.uiUpdateSource$.subscribe((val: any[]) => {
      if (val != null && val.length > 0 && !this.defaultSortOrderInitialized) {
        let i = 0;
        val.forEach((v) => {
          v._defaultSortOrder = i++;
        });
        this.defaultSortOrderInitialized = true;
      }
    });

    pTreeTable.sort = (event: any) => {
      if (pTreeTable.sortMode === 'single') {
        if (
          pTreeTable.sortField === event.field &&
          pTreeTable.sortOrder === -1
        ) {
          event.field = '_defaultSortOrder';
        }

        pTreeTable._sortOrder =
          pTreeTable.sortField === event.field
            ? pTreeTable.sortOrder * -1
            : pTreeTable.defaultSortOrder;
        pTreeTable._sortField = event.field;
        pTreeTable.sortSingle();
      }
      if (
        pTreeTable.sortMode === 'multiple' &&
        pTreeTable._multiSortMeta &&
        pTreeTable.multiSortMeta
      ) {
        let resetIndex = false;
        const sortMeta = pTreeTable.getSortMeta(event.field);

        if (sortMeta) {
          for (let i = 0; i < pTreeTable._multiSortMeta.length; i++) {
            if (pTreeTable._multiSortMeta[i].field === sortMeta.field) {
              pTreeTable._multiSortMeta.splice(i, 1);
            }
          }
          if (sortMeta.order === 1) {
            sortMeta.order = sortMeta.order * -1;
            pTreeTable.multiSortMeta.push(sortMeta);
          }
          if (pTreeTable._multiSortMeta?.length === 0) {
            pTreeTable.multiSortMeta.push({
              field: '_defaultSortOrder',
              order: pTreeTable.defaultSortOrder
            });
            resetIndex = true;
          }
        } else {
          if (!pTreeTable.multiSortMeta) {
            pTreeTable._multiSortMeta = [];
          }
          pTreeTable.multiSortMeta.push({
            field: event.field,
            order: pTreeTable.defaultSortOrder
          });
        }

        pTreeTable.sortMultiple();
        if (resetIndex) pTreeTable._multiSortMeta = [];
      }
    };

    pTreeTable.sortNodes = (nodes) => {
      if (!nodes || nodes.length === 0) {
        return;
      }

      if (pTreeTable.customSort) {
        pTreeTable.sortFunction.emit({
          data: nodes,
          mode: pTreeTable.sortMode,
          field:
            pTreeTable.sortField === null ? undefined : pTreeTable.sortField,
          order: pTreeTable.sortOrder
        });
      } else {
        const isUnsort = pTreeTable.sortField === '_defaultSortOrder';
        nodes.sort((node1: any, node2: any) => {
          const value1 = isUnsort
            ? node1._defaultSortOrder
            : ObjectUtils.resolveFieldData(node1.data, pTreeTable.sortField);
          const value2 = isUnsort
            ? node2._defaultSortOrder
            : ObjectUtils.resolveFieldData(node2.data, pTreeTable.sortField);
          let result = null;

          if (value1 == null && value2 != null) result = -1;
          else if (value1 != null && value2 == null) result = 1;
          else if (value1 == null && value2 == null) result = 0;
          else if (typeof value1 === 'string' && typeof value2 === 'string')
            result = value1.localeCompare(value2, undefined, { numeric: true });
          else result = value1 < value2 ? -1 : value1 > value2 ? 1 : 0;

          return pTreeTable.sortOrder * result;
        });
      }

      for (const node of nodes) {
        if (node.children) {
          pTreeTable.sortNodes(node.children);
        }
      }
    };
    // Todo: Use explicit type
    pTreeTable.multisortField = (
      node1: any,
      node2: any,
      multiSortMeta,
      index
    ) => {
      if (
        ObjectUtils.isEmpty(pTreeTable.multiSortMeta) ||
        ObjectUtils.isEmpty(multiSortMeta[index])
      ) {
        return 0;
      }
      const isUnsort = multiSortMeta[index].field === '_defaultSortOrder';
      const value1 = isUnsort
        ? node1._defaultSortOrder
        : ObjectUtils.resolveFieldData(node1.data, multiSortMeta[index].field);
      const value2 = isUnsort
        ? node2._defaultSortOrder
        : ObjectUtils.resolveFieldData(node2.data, multiSortMeta[index].field);
      let result = 0;

      if (value1 == null && value2 != null) result = -1;
      else if (value1 != null && value2 == null) result = 1;
      else if (value1 == null && value2 == null) result = 0;
      if (typeof value1 === 'string' || value1 instanceof String) {
        if (value1.localeCompare && value1 !== value2) {
          return (
            multiSortMeta[index].order *
            value1.localeCompare(value2, undefined, { numeric: true })
          );
        }
      } else {
        result = value1 < value2 ? -1 : 1;
      }

      if (value1 === value2) {
        return multiSortMeta.length - 1 > index
          ? pTreeTable.multisortField(node1, node2, multiSortMeta, index + 1)
          : 0;
      }

      return multiSortMeta[index].order * result;
    };
  }
}
