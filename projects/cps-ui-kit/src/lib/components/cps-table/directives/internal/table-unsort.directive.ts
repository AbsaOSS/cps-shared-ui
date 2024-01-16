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
            (pTable.multiSortMeta as any) = null;
            this.resetSorting = true;
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
            this._sortData(field, order);
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

    pTable.sortMultiple = () => {
      if (pTable.groupRowsBy) {
        if (!pTable._multiSortMeta)
          pTable._multiSortMeta = [pTable.getGroupRowsMeta()];
        else if (pTable.multiSortMeta[0].field !== pTable.groupRowsBy)
          pTable._multiSortMeta = [
            pTable.getGroupRowsMeta(),
            ...pTable._multiSortMeta
          ];
      }

      if (
        (pTable.multiSortMeta && pTable.multiSortMeta.length > 0) ||
        this.resetSorting
      ) {
        if (pTable.lazy) {
          pTable.onLazyLoad.emit(pTable.createLazyLoadMetadata());
        } else if (pTable.value) {
          if (pTable.customSort) {
            pTable.sortFunction.emit({
              data: pTable.value,
              mode: pTable.sortMode,
              multiSortMeta: pTable.multiSortMeta
            });
          } else {
            this._sortData();
          }

          if (pTable.hasFilter()) {
            pTable._filter();
          }
        }

        pTable.onSort.emit({
          multisortmeta: pTable.multiSortMeta
        });
        pTable.tableService.onSort(pTable.multiSortMeta);
      }
    };
  }

  resetDefaultSortOrder() {
    this.sortIndices = [];
  }

  private _sortData(field?: any, order?: any) {
    // restore default sort order
    if (this.resetSorting && this.sortIndices.length > 0) {
      this.pTable._value = this.sortIndices.map(
        (index) => this.pTable._value[index]
      );
      this.resetDefaultSortOrder();
    } else {
      const toSort: any[] = [];
      if (this.sortIndices.length < 1) {
        this.sortIndices = Array.from(
          { length: this.pTable.value.length },
          (_, index) => index
        );
      }

      for (let i = 0; i < this.pTable.value.length; i++) {
        toSort.push([this.pTable.value[i], this.sortIndices.indexOf(i)]);
      }

      if (this.pTable.sortMode === 'single') {
        toSort.sort((data1, data2) => {
          const value1 = ObjectUtils.resolveFieldData(data1[0], field);
          const value2 = ObjectUtils.resolveFieldData(data2[0], field);
          return this.pTable.compareValuesOnSort(value1, value2, order);
        });
      } else {
        toSort.sort((data1, data2) => {
          return this._multisortField(data1, data2, 0);
        });
      }

      for (let i = 0; i < toSort.length; i++) {
        this.sortIndices[toSort[i][1]] = i;
        this.pTable.value[i] = toSort[i][0];
      }
    }

    this.pTable._value = [...this.pTable.value];
  }

  private _multisortField(data1: any, data2: any, index: number): number {
    const value1 = ObjectUtils.resolveFieldData(
      data1[0],
      this.pTable.multiSortMeta[index].field
    );
    const value2 = ObjectUtils.resolveFieldData(
      data2[0],
      this.pTable.multiSortMeta[index].field
    );
    if (ObjectUtils.compare(value1, value2, this.pTable.filterLocale) === 0) {
      return this.pTable.multiSortMeta.length - 1 > index
        ? this._multisortField(data1, data2, index + 1)
        : 0;
    }
    return this.pTable.compareValuesOnSort(
      value1,
      value2,
      this.pTable.multiSortMeta[index].order
    );
  }
}
