import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Paginator, PaginatorModule } from 'primeng/paginator';
import { CpsSelectComponent } from '../cps-select/cps-select.component';
import { getCSSColor } from '../../utils/colors-utils';

@Component({
  selector: 'cps-paginator',
  standalone: true,
  imports: [CommonModule, PaginatorModule, CpsSelectComponent],
  templateUrl: './cps-paginator.component.html',
  styleUrls: ['./cps-paginator.component.scss']
})
export class CpsPaginatorComponent implements OnInit {
  /**
   * Zero-relative number of the first row to be displayed.
   * @group Props
   */
  @Input() first = 0;
  /**
   * Data count to display per page.
   * @group Props
   */
  @Input() rows = 0;
  /**
   * Number of total records.
   * @group Props
   */
  @Input() totalRecords = 0;
  /**
   * Array of integer values to display inside rows per page dropdown. A object that have 'showAll' key can be added to it to show all data. Exp; [10,20,30]
   * @group Props
   */
  @Input() rowsPerPageOptions: number[] = [];
  /**
   * Whether to show it even there is only one page.
   * @group Props
   */
  @Input() alwaysShow = true;
  /**
   * Color of paginator background.
   * @group Props
   */
  @Input() backgroundColor = 'transparent';

  @Input() resetPageOnRowsChange = false;
  /**
   * Callback to invoke when page changes, the event object contains information about the new state.
   * @param {any} event - Paginator state.
   * @group Emits
   */
  @Output() pageChanged = new EventEmitter<any>();

  @ViewChild('paginator')
  paginator!: Paginator;

  rowOptions: { label: string; value: number }[] = [];

  ngOnInit(): void {
    this.backgroundColor = getCSSColor(this.backgroundColor);
    if (this.rowsPerPageOptions.length < 1)
      this.rowsPerPageOptions = [5, 10, 25, 50];

    if (!this.rows) this.rows = this.rowsPerPageOptions[0];
    else {
      if (!this.rowsPerPageOptions.includes(this.rows)) {
        throw new Error('rowsPerPageOptions must include rows');
      }
    }

    this.rowOptions = this.rowsPerPageOptions.map((v) => ({
      label: '' + v,
      value: v
    }));
  }

  onPageChange(event: any) {
    this.first = event.first;
    this.rows = event.rows;
    this.pageChanged.emit(event);
  }

  onRowsPerPageChange(rows: number) {
    if (this.resetPageOnRowsChange) {
      this.first = 0;
      this.paginator.first = 0;
    }
    this.paginator.rows = rows;
    this.paginator.onRppChange(rows);
  }
}
