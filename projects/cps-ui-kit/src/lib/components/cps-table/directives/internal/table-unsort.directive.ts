import { Directive, Host, Self, Optional } from '@angular/core';
import { SortMeta } from 'primeng/api';
import { Table } from 'primeng/table';
import { ObjectUtils } from 'primeng/utils';

@Directive({
  standalone: true,
  selector: '[tWithUnsort]',
  exportAs: 'tWithUnsort'
})
export class TableUnsortDirective {
  resetSorting = false;
  sortIndices: number[] = [];

  constructor(@Host() @Self() @Optional() public pTable: Table) {
    pTable.sort = (event: any) => {
      if (pTable.sortMode === 'single') {
        if (pTable.sortField === event.field && pTable.sortOrder === -1) {
          pTable._sortOrder = pTable.defaultSortOrder;
          (pTable._sortField as any) = null;
          this.resetSorting = true;
        } else {
          pTable._sortOrder =
            pTable.sortField === event.field
              ? pTable.sortOrder * -1
              : pTable.defaultSortOrder;
          pTable._sortField = event.field;
        }
        pTable.sortSingle();
      }
      if (pTable.sortMode === 'multiple') {
        let resetIndex = false;
        const sortMeta = pTable.getSortMeta(event.field);

        if (sortMeta) {
          for (let i = 0; i < pTable._multiSortMeta.length; i++) {
            if (pTable._multiSortMeta[i].field === sortMeta.field) {
              pTable._multiSortMeta.splice(i, 1);
            }
          }
          if (sortMeta.order === 1) {
            sortMeta.order = sortMeta.order * -1;
            pTable.multiSortMeta.push(sortMeta);
          }
          if (pTable._multiSortMeta?.length === 0) {
            pTable.multiSortMeta.push({
              field: '_defaultSortOrder',
              order: pTable.defaultSortOrder
            });
            resetIndex = true;
          }
        } else {
          if (!pTable.multiSortMeta) {
            pTable._multiSortMeta = [];
          }
          pTable.multiSortMeta.push({
            field: event.field,
            order: pTable.defaultSortOrder
          });
        }

        pTable.sortMultiple();
        if (resetIndex) pTable._multiSortMeta = [];
      }

      if (pTable.isStateful()) {
        pTable.saveState();
      }

      pTable.anchorRowIndex = 0;
      this.resetSorting = false;
    };

    pTable.sortSingle = () => {
      const field = pTable.sortField || pTable.groupRowsBy;
      const order = pTable.sortField
        ? pTable.sortOrder
        : pTable.groupRowsByOrder;
      if (
        pTable.groupRowsBy &&
        pTable.sortField &&
        pTable.groupRowsBy !== pTable.sortField
      ) {
        pTable._multiSortMeta = [
          pTable.getGroupRowsMeta(),
          { field: pTable.sortField, order: pTable.sortOrder }
        ];
        pTable.sortMultiple();
        return;
      }

      if (order && (field || this.resetSorting)) {
        if (pTable.restoringSort) {
          pTable.restoringSort = false;
        }

        if (pTable.lazy) {
          pTable.onLazyLoad.emit(pTable.createLazyLoadMetadata());
        } else if (pTable.value) {
          if (pTable.customSort) {
            pTable.sortFunction.emit({
              data: pTable.value,
              mode: pTable.sortMode,
              field,
              order
            });
          } else {
            // restore default sort order
            if (this.resetSorting && this.sortIndices.length > 0) {
              pTable._value = this.sortIndices.map(
                (index) => pTable._value[index]
              );
              this.resetDefaultSortOrder();
            } else {
              const toSort: any[] = [];
              if (this.sortIndices.length < 1) {
                this.sortIndices = Array.from(
                  { length: pTable.value.length },
                  (_, index) => index
                );
              }
              for (let i = 0; i < pTable.value.length; i++) {
                toSort.push([pTable.value[i], this.sortIndices.indexOf(i)]);
              }

              toSort.sort((data1, data2) => {
                const value1 = ObjectUtils.resolveFieldData(data1[0], field);
                const value2 = ObjectUtils.resolveFieldData(data2[0], field);
                return pTable.compareValuesOnSort(value1, value2, order);
              });

              for (let i = 0; i < toSort.length; i++) {
                this.sortIndices[toSort[i][1]] = i;
                pTable.value[i] = toSort[i][0];
              }
            }

            pTable._value = [...pTable.value];
          }

          if (pTable.hasFilter()) {
            pTable._filter();
          }
        }

        const sortMeta: SortMeta = {
          field,
          order
        };

        pTable.onSort.emit(sortMeta);
        pTable.tableService.onSort(sortMeta);
      }
    };
  }

  resetDefaultSortOrder() {
    this.sortIndices = [];
  }
}
