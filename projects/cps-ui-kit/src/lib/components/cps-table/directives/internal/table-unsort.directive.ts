import { Directive, Host, Self, Optional } from '@angular/core';
import { Table } from 'primeng/table';

@Directive({
  standalone: true,
  selector: '[tWithUnsort]'
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
        let resetIndex = false;
        const sortMeta = pTable.getSortMeta(event.field);

        // Todo: Use explicit type in the whole block
        if (sortMeta) {
          for (let i = 0; i < (pTable._multiSortMeta as any).length; i++) {
            if ((pTable._multiSortMeta as any)[i].field === sortMeta.field) {
              (pTable._multiSortMeta as any).splice(i, 1);
            }
          }
          if (sortMeta.order === 1) {
            sortMeta.order = sortMeta.order * -1;
            (pTable.multiSortMeta as any).push(sortMeta);
          }
          if (pTable._multiSortMeta?.length === 0) {
            (pTable.multiSortMeta as any).push({
              field: '_defaultSortOrder',
              order: pTable.defaultSortOrder
            });
            resetIndex = true;
          }
        } else {
          if (!pTable.multiSortMeta) {
            pTable._multiSortMeta = [];
          }
          (pTable.multiSortMeta as any).push({
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
    };
  }
}
