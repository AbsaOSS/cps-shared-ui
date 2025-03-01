import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CpsTableComponent,
  CpsTableColumnFilterDirective,
  CpsTableColumnSortableDirective,
  CpsTableColumnResizableDirective,
  CpsTableHeaderSelectableDirective,
  CpsTabGroupComponent,
  CpsTabComponent,
  CpsButtonToggleComponent,
  CpsButtonToggleOption,
  CpsTableSize,
  CpsTabChangeEvent,
  CpsColumnFilterMatchMode,
  CpsMenuItem
} from 'cps-ui-kit';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';

import ComponentData from '../../api-data/cps-table.json';

@Component({
  selector: 'app-table-page',
  imports: [
    CommonModule,
    FormsModule,
    CpsTableComponent,
    CpsTableColumnSortableDirective,
    CpsTableColumnFilterDirective,
    CpsTableHeaderSelectableDirective,
    CpsTableColumnResizableDirective,
    CpsTabGroupComponent,
    CpsTabComponent,
    CpsButtonToggleComponent,
    ComponentDocsViewerComponent
  ],
  templateUrl: './table-page.component.html',
  styleUrls: ['./table-page.component.scss'],
  host: { class: 'composition-page' }
})
export class TablePageComponent implements OnInit {
  selectedTabIndex = 0;

  dateMatchModes = [
    CpsColumnFilterMatchMode.DATE_BEFORE,
    CpsColumnFilterMatchMode.DATE_AFTER
  ];

  sizesOptions: CpsButtonToggleOption[] = [
    { label: 'Small', value: 'small' },
    { label: 'Normal', value: 'normal' },
    { label: 'Large', value: 'large' }
  ];

  selSize: CpsTableSize = 'small';

  isRemoveBtnVisible = false;

  renderAsHTML = true;

  dataWithHTML = [
    {
      a: '<h1>hello</h1>',
      b: '<h2>world</h2>',
      c: '<a href="https://www.github.com">link to github</a>'
    },
    {
      a: 'this is sanitized <script>console.log("pwned")</script>',
      b: '<img src="./assets/ui_logo.svg" width="100" />',
      c: '<code>null === undefined</code>'
    }
  ];

  data = [
    {
      a: 'a1',
      b: new Date(2022, 5, 15),
      c: 0.0,
      d: true,
      e: 'Panda',
      f: { desc: 'expanded row contents', id: 1 }
    },
    {
      a: 'a2',
      b: new Date(2021, 7, 10),
      c: 0.1,
      d: false,
      e: 'Elephant',
      f: { desc: 'expanded row contents', id: 2 }
    },
    {
      a: 'a3',
      b: new Date(2023, 0, 31),
      c: 0.2,
      d: false,
      e: 'Lion',
      f: { desc: 'expanded row contents', id: 3 }
    },
    {
      a: 'a4',
      b: new Date(2022, 8, 25),
      c: 0.3,
      d: true,
      e: 'Dolphin',
      f: { desc: 'expanded row contents', id: 4 }
    },
    {
      a: 'a5',
      b: new Date(2023, 0, 31),
      c: 0.4,
      d: false,
      e: 'Penguin',
      f: { desc: 'expanded row contents', id: 5 }
    },
    {
      a: 'a6',
      b: new Date(2022, 3, 5),
      c: 0.5,
      d: true,
      e: 'Panda',
      f: { desc: 'expanded row contents', id: 6 }
    },
    {
      a: 'a7',
      b: new Date(2023, 4, 20),
      c: 0.6,
      d: true,
      e: 'Lion',
      f: { desc: 'expanded row contents', id: 7 }
    },
    {
      a: 'a8',
      b: new Date(2021, 2, 22),
      c: 0.7,
      d: true,
      e: 'Elephant',
      f: { desc: 'expanded row contents', id: 8 }
    },
    {
      a: 'a9',
      b: new Date(2023, 1, 14),
      c: 0.8,
      d: false,
      e: 'Giraffe',
      f: { desc: 'expanded row contents', id: 9 }
    },
    {
      a: 'a10',
      b: new Date(2023, 3, 7),
      c: 0.9,
      d: true,
      e: 'Chimpanzee',
      f: { desc: 'expanded row contents', id: 10 }
    },
    {
      a: 'a11',
      b: new Date(2021, 11, 29),
      c: 1,
      d: false,
      e: 'Tiger',
      f: { desc: 'expanded row contents', id: 11 }
    },
    {
      a: 'a12',
      b: new Date(2022, 11, 9),
      c: 1.1,
      d: false,
      e: 'Cheetah',
      f: { desc: 'expanded row contents', id: 12 }
    },
    {
      a: 'a13',
      b: new Date(2023, 2, 2),
      c: 1.2,
      d: false,
      e: 'Penguin',
      f: { desc: 'expanded row contents', id: 13 }
    },
    {
      a: 'a14',
      b: new Date(2022, 10, 12),
      c: 1.3,
      d: true,
      e: 'Giraffe',
      f: { desc: 'expanded row contents', id: 14 }
    },
    {
      a: 'a15',
      b: new Date(2022, 7, 18),
      c: 1.4,
      d: false,
      e: 'Tiger',
      f: { desc: 'expanded row contents', id: 15 }
    },
    {
      a: 'a16',
      b: new Date(2023, 7, 28),
      c: 1.5,
      d: true,
      e: 'Giraffe',
      f: { desc: 'expanded row contents', id: 16 }
    },
    {
      a: 'a17',
      b: new Date(2022, 1, 5),
      c: 1.6,
      d: false,
      e: 'Lion',
      f: { desc: 'expanded row contents', id: 17 }
    },
    {
      a: 'a18',
      b: new Date(2023, 8, 1),
      c: 1.7,
      d: true,
      e: 'Koala',
      f: { desc: 'expanded row contents', id: 18 }
    },
    {
      a: 'a19',
      b: new Date(2022, 2, 3),
      c: 1.8,
      d: true,
      e: 'Tiger',
      f: { desc: 'expanded row contents', id: 19 }
    },
    {
      a: 'a20',
      b: new Date(2021, 9, 16),
      c: 1.9,
      d: true,
      e: 'Octopus',
      f: { desc: 'expanded row contents', id: 20 }
    },
    {
      a: 'a21',
      b: new Date(2023, 6, 23),
      c: 2.0,
      d: false,
      e: 'Koala',
      f: { desc: 'expanded row contents', id: 21 }
    },
    {
      a: 'a22',
      b: new Date(2022, 4, 8),
      c: 2.1,
      d: false,
      e: 'Lion',
      f: { desc: 'expanded row contents', id: 22 }
    },
    {
      a: 'a23',
      b: new Date(2023, 10, 11),
      c: 2.2,
      d: false,
      e: 'Chimpanzee',
      f: { desc: 'expanded row contents', id: 23 }
    },
    {
      a: 'a24',
      b: new Date(2022, 6, 30),
      c: 2.3,
      d: false,
      e: 'Kangaroo',
      f: { desc: 'expanded row contents', id: 24 }
    },
    {
      a: 'a25',
      b: new Date(2021, 5, 26),
      c: 2.4,
      d: true,
      e: 'Lion',
      f: { desc: 'expanded row contents', id: 25 }
    },
    {
      a: 'a26',
      b: new Date(2023, 9, 17),
      c: 2.5,
      d: true,
      e: 'Kangaroo',
      f: { desc: 'expanded row contents', id: 26 }
    },
    {
      a: 'a27',
      b: new Date(2022, 9, 6),
      c: 2.6,
      d: false,
      e: 'Octopus',
      f: { desc: 'expanded row contents', id: 27 }
    },
    {
      a: 'a28',
      b: new Date(2021, 1, 11),
      c: 2.7,
      d: true,
      e: 'Koala',
      f: { desc: 'expanded row contents', id: 28 }
    },
    {
      a: 'a29',
      b: new Date(2023, 11, 24),
      c: 2.8,
      d: false,
      e: 'Koala',
      f: { desc: 'expanded row contents', id: 29 }
    },
    {
      a: 'a30',
      b: new Date(2021, 4, 4),
      c: 2.9,
      d: true,
      e: 'Cheetah',
      f: { desc: 'expanded row contents', id: 30 }
    },
    {
      a: 'a31',
      b: new Date(2023, 5, 19),
      c: 3.0,
      d: false,
      e: 'Octopus',
      f: { desc: 'expanded row contents', id: 31 }
    },
    {
      a: 'a32',
      b: new Date(2022, 0, 1),
      c: 3.1,
      d: false,
      e: 'Kangaroo',
      f: { desc: 'expanded row contents', id: 32 }
    }
  ];

  cols = [
    { field: 'a', header: 'A' }, // text
    { field: 'b', header: 'B' }, // date
    { field: 'c', header: 'C' }, // number
    { field: 'd', header: 'D' }, // boolean
    { field: 'e', header: 'E' } // category
  ];

  colsWithFilterType = [
    { field: 'a', header: 'A', filterType: 'text' },
    { field: 'b', header: 'B', filterType: 'date' },
    { field: 'c', header: 'C', filterType: 'number' },
    { field: 'd', header: 'D', filterType: 'boolean' },
    { field: 'e', header: 'E', filterType: 'category' }
  ];

  selCols: { [key: string]: any }[] = [];

  dataVirtual: {
    a: string;
    b: string;
    c: number;
    d: Date;
    e: boolean;
    f: Date;
  }[] = [];

  colsVirtual = [
    { field: 'a', header: 'String' },
    { field: 'b', header: 'String (only 5 distinct values)' },
    { field: 'c', header: 'Number' },
    { field: 'd', header: 'Date', dateFormat: 'dd. MM. yyyy' },
    { field: 'e', header: 'Boolean' },
    {
      field: 'f',
      header: 'Date but with category filter',
      filterType: 'category',
      dateFormat: 'yyyy/MM/dd HH:mm:ss'
    }
  ];

  colsHTML = this.colsVirtual.slice(0, 3);

  componentData = ComponentData;

  customRowMenuItems: CpsMenuItem[] = [
    {
      title: 'Custom menu item',
      icon: 'heart',
      action: (row: any) => {
        console.log('Custom menu item clicked', row);
      }
    },
    {
      title: 'Edit row',
      icon: 'edit',
      action: (row: any) => {
        this.onEditRowButtonClicked(row);
      }
    }
  ];

  ngOnInit(): void {
    this._genVirtualData();
    this.selCols = this.colsWithFilterType;
  }

  private _genVirtualData() {
    const sevenRandomDates = Array.from(
      { length: 7 },
      () => new Date(Math.round(Math.random() * 1e12))
    );
    let c = 0.0;
    for (let i = 0; i <= 1000; i++) {
      this.dataVirtual.push({
        a: 'a' + i,
        b: 'b' + (i % 5),
        c,
        d: new Date(new Date().valueOf() - Math.random() * 1e12),
        e: Math.random() > 0.5,
        f: sevenRandomDates[i % 7]
      });

      c = parseFloat((c += 0.1).toFixed(1));
    }
  }

  onActionBtnClicked() {
    this.isRemoveBtnVisible = !this.isRemoveBtnVisible;
    const visibilityStatus = this.isRemoveBtnVisible ? 'visible' : 'hidden';
    alert(`'Remove' buttons are now ${visibilityStatus}`);
  }

  onRowsToRemove(rows: any[]) {
    this.data = this.data.filter((r) => !rows.includes(r));
  }

  onReloadBtnClicked() {
    alert('Data reload button clicked');
  }

  onEditRowButtonClicked(item: any) {
    alert(`Edit row button clicked. Item: ${JSON.stringify(item)}`);
  }

  onRowsSelectionChanged(rows: any) {
    console.log(rows);
  }

  onColumnsSelected(columns: any) {
    this.selCols = columns;
  }

  changeTab({ newIndex }: CpsTabChangeEvent) {
    this.selectedTabIndex = newIndex;
  }
}
