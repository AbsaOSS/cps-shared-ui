import { Directive, Host, Self, Optional } from '@angular/core';
import { Table } from 'primeng/table';

@Directive({
  standalone: true,
  selector: '[withUnsort]'
})
export class TableUnsortDirective {
  defaultSortOrderInitialized = false;

  constructor(@Host() @Self() @Optional() public pTable: Table) {
    pTable.tableService.valueSource$.subscribe((val: any[]) => {
      if (val != null && val.length > 0 && !this.defaultSortOrderInitialized) {
        let i = 0;
        val.forEach((v) => {
          v._defaultSortOrder = i++;
        });
        this.defaultSortOrderInitialized = true;
      }
    });

    pTable.sort = (event: any) => {
      const originalEvent = event.originalEvent;

      if (pTable.sortMode === 'single') {
        if (pTable.sortField === event.field && pTable.sortOrder === -1) {
          event.field = '_defaultSortOrder';
        }

        pTable._sortOrder =
          pTable.sortField === event.field
            ? pTable.sortOrder * -1
            : pTable.defaultSortOrder;
        pTable._sortField = event.field;
        pTable.sortSingle();
      }
      if (pTable.sortMode === 'multiple') {
        const metaKey = originalEvent.metaKey || originalEvent.ctrlKey;
        const sortMeta = pTable.getSortMeta(event.field);

        if (sortMeta) {
          if (!metaKey) {
            if (pTable._multiSortMeta.length > 1) {
              pTable._multiSortMeta = [
                { field: event.field, order: pTable.defaultSortOrder }
              ];
            } else {
              if (sortMeta.order === -1) {
                pTable._multiSortMeta = [];
              } else {
                pTable._multiSortMeta = [
                  { field: event.field, order: sortMeta.order * -1 }
                ];
              }
            }
          } else {
            for (let i = 0; i < pTable._multiSortMeta.length; i++) {
              if (pTable._multiSortMeta[i].field === sortMeta.field) {
                pTable._multiSortMeta.splice(i, 1);
              }
            }
            if (sortMeta.order === 1) {
              sortMeta.order = sortMeta.order * -1;
              pTable.multiSortMeta.push(sortMeta);
            }
          }
        } else {
          if (!metaKey || !pTable.multiSortMeta) {
            pTable._multiSortMeta = [];
          }
          pTable.multiSortMeta.push({
            field: event.field,
            order: pTable.defaultSortOrder
          });
        }

        pTable.sortMultiple();
      }

      if (pTable.isStateful()) {
        pTable.saveState();
      }

      pTable.anchorRowIndex = 0;
    };
  }
}
