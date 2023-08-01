import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CpsTableColumnFilterComponent,
  CpsTableColumnSortableDirective,
  CpsTableComponent
} from 'cps-ui-kit';
@Component({
  selector: 'app-table-page',
  standalone: true,
  imports: [
    CommonModule,
    CpsTableComponent,
    CpsTableColumnSortableDirective,
    CpsTableColumnFilterComponent
  ],
  templateUrl: './table-page.component.html',
  styleUrls: ['./table-page.component.scss'],
  host: { class: 'composition-page' }
})
export class TablePageComponent {
  data = [
    {
      a: 'a1',
      b: 'b1',
      c: 0.0,
      d: { desc: 'expanded row contents', id: 1 }
    },
    {
      a: 'a2',
      b: 'b2',
      c: 0.1,
      d: { desc: 'expanded row contents', id: 2 }
    },
    {
      a: 'a3',
      b: 'b3',
      c: 0.2,
      d: { desc: 'expanded row contents', id: 3 }
    },
    {
      a: 'a4',
      b: 'b4',
      c: 0.3,
      d: { desc: 'expanded row contents', id: 4 }
    },
    {
      a: 'a5',
      b: 'b5',
      c: 0.4,
      d: { desc: 'expanded row contents', id: 5 }
    },
    {
      a: 'a6',
      b: 'b6',
      c: 0.5,
      d: { desc: 'expanded row contents', id: 6 }
    },
    {
      a: 'a7',
      b: 'b7',
      c: 0.6,
      d: { desc: 'expanded row contents', id: 7 }
    },
    {
      a: 'a8',
      b: 'b8',
      c: 0.7,
      d: { desc: 'expanded row contents', id: 8 }
    },
    {
      a: 'a9',
      b: 'b9',
      c: 0.8,
      d: { desc: 'expanded row contents', id: 9 }
    },
    {
      a: 'a10',
      b: 'b10',
      c: 0.9,
      d: { desc: 'expanded row contents', id: 10 }
    },
    {
      a: 'a11',
      b: 'b11',
      c: 1,
      d: { desc: 'expanded row contents', id: 11 }
    },
    {
      a: 'a12',
      b: 'b12',
      c: 1.1,
      d: { desc: 'expanded row contents', id: 12 }
    },
    {
      a: 'a13',
      b: 'b13',
      c: 1.2,
      d: { desc: 'expanded row contents', id: 13 }
    },
    {
      a: 'a14',
      b: 'b14',
      c: 1.3,
      d: { desc: 'expanded row contents', id: 14 }
    },
    {
      a: 'a15',
      b: 'b15',
      c: 1.4,
      d: { desc: 'expanded row contents', id: 15 }
    },
    {
      a: 'a16',
      b: 'b16',
      c: 1.5,
      d: { desc: 'expanded row contents', id: 16 }
    },
    {
      a: 'a17',
      b: 'b17',
      c: 1.6,
      d: { desc: 'expanded row contents', id: 17 }
    },
    {
      a: 'a18',
      b: 'b18',
      c: 1.7,
      d: { desc: 'expanded row contents', id: 18 }
    },
    {
      a: 'a19',
      b: 'b19',
      c: 1.8,
      d: { desc: 'expanded row contents', id: 19 }
    },
    {
      a: 'a20',
      b: 'b20',
      c: 1.9,
      d: { desc: 'expanded row contents', id: 20 }
    },
    {
      a: 'a21',
      b: 'b21',
      c: 2.0,
      d: { desc: 'expanded row contents', id: 21 }
    },
    {
      a: 'a22',
      b: 'b22',
      c: 2.1,
      d: { desc: 'expanded row contents', id: 22 }
    },
    {
      a: 'a23',
      b: 'b23',
      c: 2.2,
      d: { desc: 'expanded row contents', id: 23 }
    },
    {
      a: 'a24',
      b: 'b24',
      c: 2.3,
      d: { desc: 'expanded row contents', id: 24 }
    },
    {
      a: 'a25',
      b: 'b25',
      c: 2.4,
      d: { desc: 'expanded row contents', id: 25 }
    },
    {
      a: 'a26',
      b: 'b26',
      c: 2.5,
      d: { desc: 'expanded row contents', id: 26 }
    },
    {
      a: 'a27',
      b: 'b27',
      c: 2.6,
      d: { desc: 'expanded row contents', id: 27 }
    },
    {
      a: 'a28',
      b: 'b28',
      c: 2.7,
      d: { desc: 'expanded row contents', id: 28 }
    },
    {
      a: 'a29',
      b: 'b29',
      c: 2.8,
      d: { desc: 'expanded row contents', id: 29 }
    },
    {
      a: 'a30',
      b: 'b30',
      c: 2.9,
      d: { desc: 'expanded row contents', id: 30 }
    },
    {
      a: 'a31',
      b: 'b31',
      c: 3.0,
      d: { desc: 'expanded row contents', id: 31 }
    },
    {
      a: 'a32',
      b: 'b32',
      c: 3.1,
      d: { desc: 'expanded row contents', id: 32 }
    }
  ];

  cols = [
    { field: 'a', header: 'A' },
    { field: 'b', header: 'B' },
    { field: 'c', header: 'C' }
  ];

  onActionBtnClicked() {
    alert('Action button clicked');
  }

  onEditRowButtonClicked(item: any) {
    alert(`Edit row button clicked. Item: ${JSON.stringify(item)}`);
  }
}
