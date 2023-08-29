import { Directive, Host, Self, Optional } from '@angular/core';
import { TreeTable } from 'primeng/treetable';

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
      if (pTreeTable.sortMode === 'multiple') {
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

      // if (pTreeTable.isStateful()) {
      //   pTreeTable.saveState();
      // }

      // pTreeTable.anchorRowIndex = 0;
    };
  }
}
