import { Directive, Host, Self, Optional } from '@angular/core';
import { TreeTable } from 'primeng/treetable';
import { ObjectUtils } from 'primeng/utils';

@Directive({
  standalone: true,
  selector: '[ttWithUnsort]'
})
export class TreeTableUnsortDirective {
  constructor(@Host() @Self() @Optional() public pTreeTable: TreeTable) {
    this.sort(pTreeTable);
    this.sortNodes(pTreeTable);
    this.sortMultipleNodes(pTreeTable);
    this.multisortField(pTreeTable);
    this.filter(pTreeTable);
    this.findFilteredNodes(pTreeTable);
  }

  sort(pTreeTable: TreeTable) {
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
      if (pTreeTable.sortMode === 'multiple') {
        let resetIndex = false;
        const sortMeta = pTreeTable.getSortMeta(event.field);

        if (sortMeta && pTreeTable.multiSortMeta) {
          for (let i = 0; i < pTreeTable.multiSortMeta.length; i++) {
            if (pTreeTable.multiSortMeta[i].field === sortMeta.field) {
              pTreeTable.multiSortMeta.splice(i, 1);
            }
          }
          if (sortMeta.order === 1) {
            sortMeta.order = sortMeta.order * -1;
            pTreeTable.multiSortMeta.push(sortMeta);
          }
          if (pTreeTable.multiSortMeta.length === 0) {
            pTreeTable.multiSortMeta.push({
              field: '_defaultSortOrder',
              order: pTreeTable.defaultSortOrder
            });
            resetIndex = true;
          }
        } else {
          if (!pTreeTable.multiSortMeta) {
            pTreeTable.multiSortMeta = [];
          }
          pTreeTable.multiSortMeta.push({
            field: event.field,
            order: pTreeTable.defaultSortOrder
          });
        }

        pTreeTable.sortMultiple();
        if (resetIndex) pTreeTable.multiSortMeta = [];
      }
    };
  }

  sortNodes(pTreeTable: TreeTable) {
    pTreeTable.sortNodes = (nodes) => {
      if (!nodes || nodes.length === 0) {
        return;
      }

      this._syncNodesParams(pTreeTable.filteredNodes, nodes);

      if (pTreeTable.customSort) {
        pTreeTable.sortFunction.emit({
          data: nodes,
          mode: pTreeTable.sortMode,
          field: pTreeTable.sortField || undefined,
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
        if (node.children) pTreeTable.sortNodes(node.children);
      }
    };
  }

  sortMultipleNodes(pTreeTable: TreeTable) {
    pTreeTable.sortMultipleNodes = (nodes) => {
      if (!nodes || nodes.length === 0) {
        return;
      }

      this._syncNodesParams(pTreeTable.filteredNodes, nodes);

      if (pTreeTable.customSort) {
        pTreeTable.sortFunction.emit({
          data: pTreeTable.value,
          mode: pTreeTable.sortMode,
          multiSortMeta: pTreeTable.multiSortMeta
        });
      } else {
        nodes.sort((node1: any, node2: any) => {
          return pTreeTable.multisortField(
            node1,
            node2,
            pTreeTable.multiSortMeta || [],
            0
          );
        });
      }

      for (const node of nodes) {
        if (node.children) pTreeTable.sortMultipleNodes(node.children);
      }
    };
  }

  multisortField(pTreeTable: TreeTable) {
    pTreeTable.multisortField = (node1, node2, multiSortMeta, index) => {
      if (
        ObjectUtils.isEmpty(pTreeTable.multiSortMeta) ||
        ObjectUtils.isEmpty(multiSortMeta[index])
      ) {
        return 0;
      }
      const isUnsort = multiSortMeta[index].field === '_defaultSortOrder';
      const value1 = isUnsort
        ? (node1 as any)._defaultSortOrder
        : ObjectUtils.resolveFieldData(node1.data, multiSortMeta[index].field);
      const value2 = isUnsort
        ? (node2 as any)._defaultSortOrder
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

  filter(pTreeTable: TreeTable) {
    pTreeTable._filter = () => {
      if (pTreeTable.lazy) {
        pTreeTable.onLazyLoad.emit(pTreeTable.createLazyLoadMetadata());
      } else {
        if (!pTreeTable.value) {
          return;
        }

        if (!pTreeTable.hasFilter()) {
          (pTreeTable.filteredNodes as any) = null;
          if (pTreeTable.paginator) {
            pTreeTable.totalRecords = pTreeTable.value
              ? pTreeTable.value.length
              : 0;
          }
        } else {
          let globalFilterFieldsArray: any[] | undefined;
          if (pTreeTable.filters.global) {
            if (!pTreeTable.columns && !pTreeTable.globalFilterFields)
              throw new Error(
                'Global filtering requires dynamic columns or globalFilterFields to be defined.'
              );
            else
              globalFilterFieldsArray =
                pTreeTable.globalFilterFields || pTreeTable.columns;
          }

          this._syncNodesParams(pTreeTable.filteredNodes, pTreeTable.value);

          pTreeTable.filteredNodes = [];
          const isStrictMode = pTreeTable.filterMode === 'strict';
          let isValueChanged = false;

          for (const [idx, node] of pTreeTable.value.entries()) {
            let copyNode = { ...node };
            let localMatch = true;
            let globalMatch = false;
            let paramsWithoutNode;

            for (const prop in pTreeTable.filters) {
              if (
                // eslint-disable-next-line no-prototype-builtins
                pTreeTable.filters.hasOwnProperty(prop) &&
                prop !== 'global'
              ) {
                const filterMeta = pTreeTable.filters[prop];
                const filterField = prop;
                const filterValue = filterMeta?.value;
                const filterMatchMode = filterMeta?.matchMode || 'startsWith';
                const filterConstraint =
                  pTreeTable.filterService.filters[
                    filterMatchMode as keyof typeof pTreeTable.filterService.filters
                  ];
                paramsWithoutNode = {
                  filterField,
                  filterValue,
                  filterConstraint,
                  isStrictMode
                };
                if (
                  (isStrictMode &&
                    !(
                      pTreeTable.findFilteredNodes(
                        copyNode,
                        paramsWithoutNode
                      ) ||
                      pTreeTable.isFilterMatched(
                        copyNode,
                        paramsWithoutNode as any
                      )
                    )) ||
                  (!isStrictMode &&
                    !(
                      pTreeTable.isFilterMatched(
                        copyNode,
                        paramsWithoutNode as any
                      ) ||
                      pTreeTable.findFilteredNodes(copyNode, paramsWithoutNode)
                    ))
                ) {
                  localMatch = false;
                }

                if (!localMatch) {
                  break;
                }
              }
            }

            if (
              pTreeTable.filters.global &&
              !globalMatch &&
              globalFilterFieldsArray
            ) {
              const copyNodeForGlobal = { ...copyNode };
              const filterField = undefined;
              const filterValue = pTreeTable.filters.global.value;
              const filterConstraint =
                pTreeTable.filterService.filters[
                  pTreeTable.filters.global
                    .matchMode as keyof typeof pTreeTable.filterService.filters
                ];
              paramsWithoutNode = {
                filterField,
                filterValue,
                filterConstraint,
                isStrictMode,
                globalFilterFieldsArray
              };

              if (
                (isStrictMode &&
                  (pTreeTable.findFilteredNodes(
                    copyNodeForGlobal,
                    paramsWithoutNode
                  ) ||
                    pTreeTable.isFilterMatched(
                      copyNodeForGlobal,
                      paramsWithoutNode as any
                    ))) ||
                (!isStrictMode &&
                  (pTreeTable.isFilterMatched(
                    copyNodeForGlobal,
                    paramsWithoutNode as any
                  ) ||
                    pTreeTable.findFilteredNodes(
                      copyNodeForGlobal,
                      paramsWithoutNode
                    )))
              ) {
                globalMatch = true;
                copyNode = copyNodeForGlobal;
              }
            }

            let matches = localMatch;
            if (pTreeTable.filters.global) {
              matches = localMatch && globalMatch;
            }

            if (matches) {
              (copyNode as any)._idx = idx;
              pTreeTable.filteredNodes.push(copyNode);
            }

            isValueChanged =
              isValueChanged ||
              !localMatch ||
              globalMatch ||
              (localMatch && pTreeTable.filteredNodes.length > 0) ||
              (!globalMatch && pTreeTable.filteredNodes.length === 0);
          }

          if (!isValueChanged) {
            (pTreeTable.filteredNodes as any) = null;
          }

          if (pTreeTable.paginator) {
            pTreeTable.totalRecords = pTreeTable.filteredNodes
              ? pTreeTable.filteredNodes.length
              : pTreeTable.value
                ? pTreeTable.value.length
                : 0;
          }
        }
      }

      pTreeTable.first = 0;

      const filteredValue = pTreeTable.filteredNodes || pTreeTable.value;

      pTreeTable.onFilter.emit({
        filters: pTreeTable.filters,
        filteredValue
      });

      pTreeTable.tableService.onUIUpdate(filteredValue);
      pTreeTable.updateSerializedValue();

      if (pTreeTable.scrollable) {
        pTreeTable.resetScrollTop();
      }
    };
  }

  findFilteredNodes(pTreeTable: TreeTable) {
    pTreeTable.findFilteredNodes = (node, paramsWithoutNode): any => {
      if (node) {
        let matched = false;
        if (node.children) {
          const childNodes = [...node.children];
          node.children = [];
          for (const [idx, childNode] of childNodes.entries()) {
            const copyChildNode = { ...childNode };
            if (pTreeTable.isFilterMatched(copyChildNode, paramsWithoutNode)) {
              matched = true;
              (copyChildNode as any)._idx = idx;
              node.children.push(copyChildNode);
            }
          }
        }

        if (matched) {
          return true;
        }
      }
    };
  }

  private _syncNodesParams(
    from: any[] | undefined | null,
    to: any[] | undefined
  ) {
    if (!from || !to) return;

    from.forEach((source) => {
      const idx = source._idx;
      if (typeof idx === 'number') {
        const target = to[idx];
        delete source._idx;
        if (target) {
          target.expanded = source.expanded;
          target.partialSelected = source.partialSelected;
          this._syncNodesParams(source.children, target.children);
        }
      }
    });
  }
}
