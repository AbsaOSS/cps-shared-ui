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
  @Input() first = 0;
  @Input() rows = 0;
  @Input() totalRecords = 0;
  @Input() rowsPerPageOptions: number[] = [];
  @Input() alwaysShow = true;
  @Input() backgroundColor = 'transparent';
  @Input() resetPageOnRowsChange = false;

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
