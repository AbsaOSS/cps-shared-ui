import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import { SortAltIcon } from 'primeng/icons/sortalt';
import { SortAmountDownIcon } from 'primeng/icons/sortamountdown';
import { SortAmountUpAltIcon } from 'primeng/icons/sortamountupalt';
import { TreeTable } from 'primeng/treetable';
import { Subscription } from 'rxjs';

@Component({
  selector: 'tree-table-sort-icon',
  standalone: true,
  imports: [CommonModule, SortAltIcon, SortAmountUpAltIcon, SortAmountDownIcon],
  templateUrl: './tree-table-sort-icon.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'p-element'
  }
})
export class TreeTableSortIconComponent implements OnInit, OnDestroy {
  @Input() field = '';

  subscription: Subscription;

  sortOrder = 0;

  constructor(public tt: TreeTable, public cd: ChangeDetectorRef) {
    this.subscription = this.tt.tableService.sortSource$.subscribe(
      (sortMeta) => {
        this.updateSortState();
        this.cd.markForCheck();
      }
    );
  }

  ngOnInit() {
    this.updateSortState();
  }

  onClick(event: any) {
    event.preventDefault();
  }

  updateSortState() {
    if (this.tt.sortMode === 'single') {
      this.sortOrder = this.tt.isSorted(this.field) ? this.tt.sortOrder : 0;
    } else if (this.tt.sortMode === 'multiple') {
      const sortMeta = this.tt.getSortMeta(this.field);
      this.sortOrder = sortMeta ? sortMeta.order : 0;
    }
  }

  getMultiSortMetaIndex() {
    const multiSortMeta = this.tt._multiSortMeta;
    let index = -1;

    if (
      multiSortMeta &&
      this.tt.sortMode === 'multiple' &&
      multiSortMeta.length > 1
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
    return this.getMultiSortMetaIndex() + 1;
  }

  isMultiSorted() {
    return this.tt.sortMode === 'multiple' && this.getMultiSortMetaIndex() > -1;
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
