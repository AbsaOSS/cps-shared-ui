import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  Optional
} from '@angular/core';
import { Table } from 'primeng/table';
import { TreeTable } from 'primeng/treetable';
import { Subscription } from 'rxjs';

@Component({
  selector: 'cps-sort-icon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cps-sort-icon.component.html',
  styleUrls: ['./cps-sort-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CpsSortIconComponent implements OnInit, OnDestroy {
  @Input() field = '';

  subscription: Subscription;

  sortOrder = 0;

  _tableInstance: Table | TreeTable;

  constructor(
    @Optional() public dt: Table,
    @Optional() public tt: TreeTable,
    public cd: ChangeDetectorRef
  ) {
    this._tableInstance = dt || tt;
    this.subscription = this._tableInstance.tableService.sortSource$.subscribe(
      () => {
        this.updateSortState();
      }
    );
  }

  ngOnInit() {
    this.updateSortState();
  }

  onClick(event: Event) {
    event.preventDefault();
  }

  updateSortState() {
    if (this._tableInstance.sortMode === 'single') {
      this.sortOrder = this._tableInstance.isSorted(this.field)
        ? this._tableInstance.sortOrder
        : 0;
    } else if (this._tableInstance.sortMode === 'multiple') {
      const sortMeta = this._tableInstance.getSortMeta(this.field);
      this.sortOrder = sortMeta ? sortMeta.order : 0;
    }
    this.cd.markForCheck();
  }

  getMultiSortMetaIndex() {
    const multiSortMeta = this._tableInstance._multiSortMeta;
    let index = -1;

    if (
      multiSortMeta &&
      this._tableInstance.sortMode === 'multiple' &&
      ((this.dt && this.dt.showInitialSortBadge) || multiSortMeta.length > 1)
    ) {
      for (let i = 0; i < multiSortMeta.length; i++) {
        const meta = multiSortMeta[i];
        if (meta.field === this.field || meta.field === this.field) {
          index = i;
          break;
        }
      }
    }

    return index;
  }

  getBadgeValue() {
    const index = this.getMultiSortMetaIndex();
    return this.dt && this.dt.groupRowsBy && index > -1 ? index : index + 1;
  }

  isMultiSorted() {
    return (
      this._tableInstance.sortMode === 'multiple' &&
      this.getMultiSortMetaIndex() > -1
    );
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
