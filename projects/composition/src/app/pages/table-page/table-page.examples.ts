const tableDataTs = `
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
  }
  // ...more rows omitted for brevity
];`;

export const tableExamples: Record<string, { html: string; ts?: string }> = {
  table1: {
    html: `
<cps-table
  [data]="data"
  [paginator]="true"
  sortMode="multiple"
  toolbarTitle="Table with a paginator, multiple sorting and individual filtering">
  <ng-template #header>
    <th cpsTColSortable="a" cpsTColFilter="a" filterType="text">A</th>
    <th
      cpsTColSortable="b"
      cpsTColFilter="b"
      filterType="date"
      [filterMatchModes]="dateMatchModes"
      [filterShowOperator]="false">
      B
    </th>
    <th cpsTColSortable="c" cpsTColFilter="c" filterType="number">C</th>
    <th cpsTColSortable="d" cpsTColFilter="d" filterType="boolean">D</th>
    <th cpsTColSortable="e" cpsTColFilter="e" filterType="category">E</th>
  </ng-template>

  <ng-template let-item #body>
    <td>{{ item.a | uppercase }}</td>
    <td>{{ item.b | date: 'MM/dd/yyyy' }}</td>
    <td>{{ item.c | percent }}</td>
    <td>
      <cps-icon
        [icon]="item.d ? 'checked' : 'close-x'"
        [color]="
          item.d ? 'var(--cps-color-success)' : 'var(--cps-color-error)'
        "
        size="small"
        [ariaLabel]="item.d ? 'True' : 'False'">
      </cps-icon>
    </td>
    <td>{{ item.e }}</td>
  </ng-template>
</cps-table>`,
    ts: `
${tableDataTs.trim()}

dateMatchModes = [
  CpsColumnFilterMatchMode.DATE_BEFORE,
  CpsColumnFilterMatchMode.DATE_AFTER
];`
  },

  table2: {
    html: `
<cps-table
  [showGlobalFilter]="true"
  [data]="dataVirtual"
  [columns]="colsVirtual"
  [sortable]="true"
  [virtualScroll]="true"
  [showColumnsToggleBtn]="true"
  scrollHeight="31.25rem"
  toolbarTitle="Sortable table with resizable columns, virtual scroller, global filter, internal columns toggle and with column filtering enabled"
  [filterableByColumns]="true"
  [resizableColumns]="true">
</cps-table>`,
    ts: `
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

dataVirtual: {
  a: string;
  b: string;
  c: number;
  d: Date;
  e: boolean;
  f: Date;
}[] = [];

ngOnInit(): void {
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
}`
  },

  table3: {
    html: `
<cps-table
  [data]="data"
  [reorderableRows]="true"
  [showActionBtn]="true"
  [showRowMenu]="true"
  [showRowRemoveButton]="isRemoveBtnVisible"
  (rowsToRemove)="onRowsToRemove($event)"
  [showDataReloadBtn]="true"
  (editRowBtnClicked)="onEditRowButtonClicked($event)"
  (actionBtnClicked)="onActionBtnClicked()"
  (dataReloadBtnClicked)="onReloadBtnClicked()"
  toolbarTitle="Table with resizable columns (expand mode), draggable rows, rows menus, action and data reload buttons. Each row menu has a 'Remove' button, which is currently {{
    isRemoveBtnVisible ? 'visible' : 'hidden'
  }}"
  actionBtnTitle="{{
    isRemoveBtnVisible ? 'Hide' : 'Show'
  }} Remove buttons"
  [resizableColumns]="true"
  [columnResizeMode]="'expand'">
  <ng-template #header>
    <th cpsTColResizable>A</th>
    <th cpsTColResizable>B</th>
    <th cpsTColResizable>C</th>
    <th cpsTColResizable>D</th>
    <th cpsTColResizable>E</th>
  </ng-template>

  <ng-template let-item #body>
    <td>{{ item.a | uppercase }}</td>
    <td>{{ item.b | date: 'MM/dd/yyyy' }}</td>
    <td>{{ item.c | percent }}</td>
    <td>
      <cps-icon
        [icon]="item.d ? 'checked' : 'close-x'"
        [color]="
          item.d ? 'var(--cps-color-success)' : 'var(--cps-color-error)'
        "
        size="small"
        [ariaLabel]="item.d ? 'True' : 'False'">
      </cps-icon>
    </td>
    <td>{{ item.e }}</td>
  </ng-template>
</cps-table>`,
    ts: `
${tableDataTs.trim()}

isRemoveBtnVisible = false;

onRowsToRemove(rows: any[]) {
  this.data = this.data.filter((r) => !rows.includes(r));
}

onEditRowButtonClicked(item: any) {
  alert(\`Edit row button clicked. Item: \${JSON.stringify(item)}\`);
}

onActionBtnClicked() {
  this.isRemoveBtnVisible = !this.isRemoveBtnVisible;
  const visibilityStatus = this.isRemoveBtnVisible ? 'visible' : 'hidden';
  alert(\`'Remove' buttons are now \${visibilityStatus}\`);
}

onReloadBtnClicked() {
  alert('Data reload button clicked');
}`
  },

  table4: {
    html: `
<cps-table
  [data]="data"
  dataKey="a"
  [columns]="colsWithFilterType"
  [selectable]="true"
  sortMode="multiple"
  [striped]="false"
  [showRowMenu]="true"
  (rowsToRemove)="onRowsToRemove($event)"
  [showColumnsToggleBtn]="true"
  (columnsSelected)="onColumnsSelected($event)"
  (editRowBtnClicked)="onEditRowButtonClicked($event)"
  (rowsSelected)="onRowsSelectionChanged($event)"
  toolbarIcon="toast-success"
  toolbarIconColor="success"
  toolbarTitle="Table with toolbar icon, external columns toggle, unstriped selectable and expandable rows">
  <ng-template #header>
    @for (scol of selCols; track scol) {
      <th
        [cpsTColSortable]="scol.field"
        [cpsTColFilter]="scol.field"
        [filterType]="scol.filterType">
        {{ scol.header }}
      </th>
    }
  </ng-template>

  <ng-template let-item #body>
    @for (scol of selCols; track scol) {
      @switch (scol.field) {
        @case ('a') {
          <td>{{ item.a | uppercase }}</td>
        }
        @case ('b') {
          <td>{{ item.b | date: 'MM/dd/yyyy' }}</td>
        }
        @case ('c') {
          <td>{{ item.c | percent }}</td>
        }
        @case ('d') {
          <td>
            <cps-icon
              [icon]="item.d ? 'checked' : 'close-x'"
              [color]="
                item.d
                  ? 'var(--cps-color-success)'
                  : 'var(--cps-color-error)'
              "
              size="small"
              [ariaLabel]="item.d ? 'True' : 'False'">
            </cps-icon>
          </td>
        }
        @case ('e') {
          <td>{{ item.e }}</td>
        }
      }
    }
  </ng-template>

  <ng-template let-item #rowexpansion>
    <div>
      <div>id: {{ item.f.id }}</div>
      <div>desc: {{ item.f.desc }}</div>
    </div>
  </ng-template>
</cps-table>`,
    ts: `
${tableDataTs.trim()}

colsWithFilterType = [
  { field: 'a', header: 'A', filterType: 'text' },
  { field: 'b', header: 'B', filterType: 'date' },
  { field: 'c', header: 'C', filterType: 'number' },
  { field: 'd', header: 'D', filterType: 'boolean' },
  { field: 'e', header: 'E', filterType: 'category' }
];

selCols = this.colsWithFilterType;

onRowsToRemove(rows: any[]) {
  this.data = this.data.filter((r) => !rows.includes(r));
}

onColumnsSelected(columns: any) {
  this.selCols = columns;
}

onEditRowButtonClicked(item: any) {
  alert(\`Edit row button clicked. Item: \${JSON.stringify(item)}\`);
}

onRowsSelectionChanged(rows: any) {
  console.log(rows);
}`
  },

  table5: {
    html: `
<cps-table
  [data]="data"
  [selectable]="true"
  toolbarSize="small"
  (rowsToRemove)="onRowsToRemove($event)"
  scrollHeight="calc(100vh - 19.375rem)"
  toolbarTitle="Table with nested header and small toolbar">
  <ng-template #nestedHeader>
    <tr>
      <!-- MANUALLY ADD FIRST HEADER WITH CHECKBOX, SINCE THE TABLE IS SELECTABLE -->
      <!-- FOR SIMPLE HEADER THIS IS DONE AUTOMATICALLY -->
      <th rowspan="2" cpsTHdrSelectable></th>
      <th colspan="2">Section 1</th>
      <th colspan="3">Section 2</th>
    </tr>
    <tr>
      <th cpsTColSortable="a" cpsTColFilter="a" filterType="text">A</th>
      <th cpsTColSortable="b" cpsTColFilter="b" filterType="date">B</th>
      <th cpsTColSortable="c" cpsTColFilter="c" filterType="number">C</th>
      <th cpsTColSortable="d" cpsTColFilter="d" filterType="boolean">
        D
      </th>
      <th cpsTColSortable="e" cpsTColFilter="e" filterType="category">
        E
      </th>
    </tr>
  </ng-template>
  <ng-template let-item #body>
    <td>{{ item.a | uppercase }}</td>
    <td>{{ item.b | date: 'MM/dd/yyyy' }}</td>
    <td>{{ item.c | percent }}</td>
    <td>
      <cps-icon
        [icon]="item.d ? 'checked' : 'close-x'"
        [color]="
          item.d ? 'var(--cps-color-success)' : 'var(--cps-color-error)'
        "
        size="small"
        [ariaLabel]="item.d ? 'True' : 'False'">
      </cps-icon>
    </td>
    <td>{{ item.e }}</td>
  </ng-template>
</cps-table>`,
    ts: `
${tableDataTs.trim()}

onRowsToRemove(rows: any[]) {
  this.data = this.data.filter((r) => !rows.includes(r));
}`
  },

  table6: {
    html: `
<cps-table
  [data]="data"
  [columns]="cols"
  [rowHover]="false"
  [bordered]="false"
  [sortable]="true"
  [showExportBtn]="true"
  [showRowMenu]="true"
  [rowMenuItems]="customRowMenuItems"
  exportFilename="table_6"
  toolbarTitle="Borderless table with export button, without highlightning on rows hover. Row menu is shown and has custom items.">
  <ng-template #header>
    <th cpsTColSortable="a">A</th>
    <th cpsTColSortable="b">B</th>
    <th cpsTColSortable="c">C</th>
    <th cpsTColSortable="d">D</th>
    <th cpsTColSortable="e">E</th>
  </ng-template>

  <ng-template let-item #body>
    <td>{{ item.a | uppercase }}</td>
    <td>{{ item.b | date: 'MM/dd/yyyy' }}</td>
    <td>{{ item.c | percent }}</td>
    <td>
      <cps-icon
        [icon]="item.d ? 'checked' : 'close-x'"
        [color]="
          item.d ? 'var(--cps-color-success)' : 'var(--cps-color-error)'
        "
        size="small"
        [ariaLabel]="item.d ? 'True' : 'False'">
      </cps-icon>
    </td>
    <td>{{ item.e }}</td>
  </ng-template>
</cps-table>`,
    ts: `
${tableDataTs.trim()}

cols = [
  { field: 'a', header: 'A' }, // text
  { field: 'b', header: 'B' }, // date
  { field: 'c', header: 'C' }, // number
  { field: 'd', header: 'D' }, // boolean
  { field: 'e', header: 'E' } // category
];

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

onEditRowButtonClicked(item: any) {
  alert(\`Edit row button clicked. Item: \${JSON.stringify(item)}\`);
}`
  },

  table7: {
    html: `
<cps-table [data]="data" [size]="selSize">
  <ng-template #toolbar>
    <span>Table with custom toolbar and different sizes</span>
    <cps-button-toggle
      ariaLabel="Table size"
      [options]="sizesOptions"
      [(ngModel)]="selSize">
    </cps-button-toggle>
  </ng-template>
  <ng-template #header>
    <th cpsTColSortable="a" cpsTColFilter="a" filterType="text">A</th>
    <th cpsTColSortable="b" cpsTColFilter="b" filterType="date">B</th>
    <th cpsTColSortable="c" cpsTColFilter="c" filterType="number">C</th>
    <th cpsTColSortable="d" cpsTColFilter="d" filterType="boolean">D</th>
    <th cpsTColSortable="e" cpsTColFilter="e" filterType="category">E</th>
  </ng-template>

  <ng-template let-item #body>
    <td>{{ item.a | uppercase }}</td>
    <td>{{ item.b | date: 'MM/dd/yyyy' }}</td>
    <td>{{ item.c | percent }}</td>
    <td>
      <cps-icon
        [icon]="item.d ? 'checked' : 'close-x'"
        [color]="
          item.d ? 'var(--cps-color-success)' : 'var(--cps-color-error)'
        "
        size="small"
        [ariaLabel]="item.d ? 'True' : 'False'">
      </cps-icon>
    </td>
    <td>{{ item.e }}</td>
  </ng-template>
</cps-table>`,
    ts: `
${tableDataTs.trim()}

sizesOptions: CpsButtonToggleOption[] = [
  { label: 'Small', value: 'small' },
  { label: 'Normal', value: 'normal' },
  { label: 'Large', value: 'large' }
];

selSize: CpsTableSize = 'small';`
  },

  table8: {
    html: `
<cps-table [data]="[]" toolbarTitle="Empty table" emptyBodyHeight="25rem">
  <ng-template #header>
    <th cpsTColSortable="a">A</th>
    <th cpsTColSortable="b">B</th>
    <th cpsTColSortable="c">C</th>
    <th cpsTColSortable="d">D</th>
    <th cpsTColSortable="e">E</th>
  </ng-template>
</cps-table>`
  },

  table9: {
    html: `
<cps-table
  [data]="data"
  [loading]="true"
  scrollHeight="25rem"
  [columns]="cols"
  toolbarTitle="Table in data loading state">
</cps-table>`,
    ts: `
${tableDataTs.trim()}

cols = [
  { field: 'a', header: 'A' },
  { field: 'b', header: 'B' },
  { field: 'c', header: 'C' },
  { field: 'd', header: 'D' },
  { field: 'e', header: 'E' }
];`
  },

  table10: {
    html: `
<cps-table
  [data]="dataWithHTML"
  scrollHeight="25rem"
  [columns]="colsHTML"
  [renderDataAsHTML]="renderAsHTML"
  [showActionBtn]="true"
  toolbarTitle="Table containing HTML"
  actionBtnTitle="renderAsHTML is set to {{
    renderAsHTML ? 'true' : 'false'
  }}"
  (actionBtnClicked)="renderAsHTML = !renderAsHTML">
</cps-table>`,
    ts: `
dataWithHTML = [
  {
    a: '<h1>hello</h1>',
    b: '<h2>world</h2>',
    c: '<a href="https://www.github.com">link to github</a>'
  },
  {
    a: 'this is sanitized <script>console.log("pwned")</script>',
    b: '<img src="./assets/ui_logo.svg" alt="CPS UI Kit logo" width="100" />',
    c: '<code>null === undefined</code>'
  }
];

colsHTML = [
  { field: 'a', header: 'String' },
  { field: 'b', header: 'String (only 5 distinct values)' },
  { field: 'c', header: 'Number' }
];

renderAsHTML = true;`
  }
};
