const treeDataTs = `
data = [
  {
    data: {
      name: 'Applications',
      size: 200,
      modified: new Date(2022, 2, 21),
      encrypted: true,
      importance: 'critical'
    },
    children: [
      {
        data: {
          name: 'Angular',
          size: 25,
          modified: new Date(2023, 4, 10),
          encrypted: true,
          importance: 'critical'
        },
        children: [
          {
            data: {
              name: 'angular.app',
              size: 10,
              modified: new Date(2021, 3, 14),
              encrypted: true,
              importance: 'critical'
            }
          }
        ]
      },
      {
        data: {
          name: 'editor.app',
          size: 30,
          modified: new Date(2022, 5, 9),
          encrypted: true,
          importance: 'critical'
        }
      }
    ]
  },
  {
    data: {
      name: 'Cloud',
      size: 10,
      modified: new Date(2023, 4, 12),
      encrypted: false,
      importance: 'optional'
    }
  }
  // ...more nodes omitted for brevity
];`;

const removeElementsByNameTs = `
onRowsToRemove(rows: any) {
  const names = rows.map((row: any) => row.data.name);
  this.data = this._removeElementsByName(this.data, names);
}

private _removeElementsByName(dataArray: any[], namesArray: string[]) {
  return dataArray.filter((item) => {
    if (namesArray.includes(item.data.name)) {
      return false;
    }
    if (item.children && item.children.length > 0) {
      item.children = this._removeElementsByName(item.children, namesArray);
    }

    return true;
  });
}`;

export const treeTableExamples: Record<string, { html: string; ts?: string }> =
  {
    treeTable1: {
      html: `
<cps-tree-table
  [data]="data"
  [paginator]="true"
  [scrollable]="false"
  sortMode="multiple"
  [resizableColumns]="true"
  [columnResizeMode]="'expand'"
  [showExportBtn]="true"
  [exportFilename]="'virtual-tree-data'"
  toolbarTitle="Tree table with a paginator, resizable columns, multiple sorting and individual filtering">
  <ng-template #header>
    <th
      cpsTTColSortable="name"
      cpsTTColFilter="name"
      filterType="text"
      cpsTTColResizable>
      Name
    </th>
    <th
      cpsTTColSortable="size"
      cpsTTColFilter="size"
      filterType="number"
      cpsTTColResizable>
      Size
    </th>
    <th
      cpsTTColSortable="modified"
      cpsTTColFilter="modified"
      filterType="date"
      cpsTTColResizable>
      Modified
    </th>
    <th
      cpsTTColSortable="encrypted"
      cpsTTColFilter="encrypted"
      filterType="boolean"
      cpsTTColResizable>
      Encrypted
    </th>
    <th
      cpsTTColSortable="importance"
      cpsTTColFilter="importance"
      filterType="category"
      cpsTTColResizable>
      Importance
    </th>
  </ng-template>

  <ng-template #body let-rowNode let-rowData="rowData">
    <td [cpsTTRowToggler]="rowNode">
      {{ rowData.name }}
    </td>
    <td>{{ rowData.size }}</td>
    <td>{{ rowData.modified | date }}</td>
    <td>
      <cps-icon
        [icon]="rowData.encrypted ? 'checked' : 'close-x'"
        [color]="
          rowData.encrypted
            ? 'var(--cps-color-success)'
            : 'var(--cps-color-error)'
        "
        size="small"
        [ariaLabel]="rowData.encrypted ? 'Encrypted' : 'Not encrypted'">
      </cps-icon>
    </td>
    <td>{{ rowData.importance }}</td>
  </ng-template>
</cps-tree-table>`,
      ts: treeDataTs.trim()
    },

    treeTable2: {
      html: `
<cps-tree-table
  [showGlobalFilter]="true"
  [data]="dataVirtual"
  [columns]="colsVirtual"
  [sortable]="true"
  [virtualScroll]="true"
  [showColumnsToggleBtn]="true"
  [filterableByColumns]="true"
  [resizableColumns]="true"
  scrollHeight="31.25rem"
  toolbarTitle="Sortable tree table with resizable columns, virtual scroller, global filter, internal columns toggle and with column filtering enabled">
  <ng-template #colgroup>
    <colgroup>
      @for (col of colsVirtual; track col) {
        <col />
      }
    </colgroup>
  </ng-template>
</cps-tree-table>`,
      ts: `
colsVirtual = [
  { field: 'name', header: 'Name' },
  { field: 'size', header: 'Size' },
  { field: 'tag', header: 'Tag' },
  { field: 'type', header: 'String (only 5 distinct values)' },
  { field: 'date', header: 'Date', dateFormat: 'dd. MM. yyyy' },
  { field: 'sizeEven', header: 'Boolean' },
  {
    field: 'date2',
    header: 'Date but with category filter',
    filterType: 'category',
    dateFormat: 'yyyy/MM/dd HH:mm:ss'
  }
];

dataVirtual: any[] = [];

ngOnInit(): void {
  for (let i = 0; i <= 1000; i++) {
    this.dataVirtual.push({
      data: {
        name: \`Folder\${i}\`,
        size: i,
        tag: i * 3,
        type: \`Type-\${i % 5}\`,
        date: new Date(2020, 1, i),
        sizeEven: i % 2 === 0,
        date2: new Date(2020, 1, i, 12, 30, 0)
      },
      children: [
        {
          data: {
            name: 'primefaces.mkv',
            size: 1000,
            tag: 7,
            type: \`Type-\${i % 5}\`,
            date: new Date(2020, 1, i),
            sizeEven: i % 2 === 0,
            date2: new Date(2020, 1, i, 12, 30, 0)
          }
        },
        {
          data: {
            name: 'intro.avi',
            size: 500,
            tag: 9,
            type: \`Type-\${i % 5}\`,
            date: new Date(2020, 1, i),
            sizeEven: i % 2 === 0,
            date2: new Date(2020, 1, i, 12, 30, 0)
          }
        }
      ]
    });
  }
}`
    },

    treeTable3: {
      html: `
<cps-tree-table
  [data]="data"
  [showActionBtn]="true"
  [showRowMenu]="true"
  [showRowRemoveButton]="isRemoveBtnVisible"
  [showDataReloadBtn]="true"
  [showGlobalFilter]="true"
  (rowsToRemove)="onRowsToRemove($event)"
  (editRowBtnClicked)="onEditRowButtonClicked()"
  (actionBtnClicked)="onActionBtnClicked()"
  (dataReloadBtnClicked)="onReloadBtnClicked()"
  toolbarTitle="Tree table with rows menus, action and data reload buttons. Each row menu has a 'Remove' button, which is currently {{
    isRemoveBtnVisible ? 'visible' : 'hidden'
  }}"
  actionBtnTitle="{{
    isRemoveBtnVisible ? 'Hide' : 'Show'
  }} Remove buttons">
  <ng-template #header>
    <th>Name</th>
    <th>Size</th>
    <th>Modified</th>
    <th>Encrypted</th>
    <th>Importance</th>
  </ng-template>

  <ng-template #body let-rowNode let-rowData="rowData">
    <td [cpsTTRowToggler]="rowNode">
      {{ rowData.name }}
    </td>
    <td>{{ rowData.size }}</td>
    <td>{{ rowData.modified | date }}</td>
    <td>
      <cps-icon
        [icon]="rowData.encrypted ? 'checked' : 'close-x'"
        [color]="
          rowData.encrypted
            ? 'var(--cps-color-success)'
            : 'var(--cps-color-error)'
        "
        size="small"
        [ariaLabel]="rowData.encrypted ? 'Encrypted' : 'Not encrypted'">
      </cps-icon>
    </td>
    <td>{{ rowData.importance }}</td>
  </ng-template>
</cps-tree-table>`,
      ts: `
${treeDataTs.trim()}

isRemoveBtnVisible = false;

${removeElementsByNameTs.trim()}

onEditRowButtonClicked() {
  alert('Edit row button clicked');
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

    treeTable4: {
      html: `
<cps-tree-table
  [data]="data"
  [columns]="colsWithFilterType"
  [selectable]="true"
  sortMode="multiple"
  [striped]="false"
  [showRowMenu]="true"
  (rowsToRemove)="onRowsToRemove($event)"
  [showColumnsToggleBtn]="true"
  (columnsSelected)="onColumnsSelected($event)"
  (editRowBtnClicked)="onEditRowButtonClicked()"
  (rowsSelected)="onRowsSelectionChanged($event)"
  toolbarIcon="toast-success"
  toolbarIconColor="success"
  toolbarTitle="Tree table with toolbar icon, external columns toggle and unstriped selectable rows">
  <ng-template #header>
    @for (scol of selCols; track scol) {
      <th
        [cpsTTColSortable]="scol.field"
        [cpsTTColFilter]="scol.field"
        [filterType]="scol.filterType">
        {{ scol.header }}
      </th>
    }
  </ng-template>

  <ng-template #body let-rowNode let-rowData="rowData">
    @for (scol of selCols; track scol) {
      @switch (scol.field) {
        @case ('name') {
          <td [cpsTTRowToggler]="rowNode">
            {{ rowData.name }}
          </td>
        }
        @case ('size') {
          <td>{{ rowData.size }}</td>
        }
        @case ('modified') {
          <td>{{ rowData.modified | date }}</td>
        }
        @case ('encrypted') {
          <td>
            <cps-icon
              [icon]="rowData.encrypted ? 'checked' : 'close-x'"
              [color]="
                rowData.encrypted
                  ? 'var(--cps-color-success)'
                  : 'var(--cps-color-error)'
              "
              size="small"
              [ariaLabel]="
                rowData.encrypted ? 'Encrypted' : 'Not encrypted'
              ">
            </cps-icon>
          </td>
        }
        @case ('importance') {
          <td>{{ rowData.importance }}</td>
        }
      }
    }
  </ng-template>
</cps-tree-table>`,
      ts: `
${treeDataTs.trim()}

colsWithFilterType = [
  { field: 'name', header: 'Name', filterType: 'text' },
  { field: 'size', header: 'Size', filterType: 'number' },
  { field: 'modified', header: 'Modified', filterType: 'date' },
  { field: 'encrypted', header: 'Encrypted', filterType: 'boolean' },
  { field: 'importance', header: 'Importance', filterType: 'category' }
];

selCols = this.colsWithFilterType;

${removeElementsByNameTs.trim()}

onColumnsSelected(columns: any) {
  this.selCols = columns;
}

onEditRowButtonClicked() {
  alert('Edit row button clicked');
}

onRowsSelectionChanged(rows: any) {
  console.log(rows);
}`
    },

    treeTable5: {
      html: `
<cps-tree-table
  [data]="data"
  [autoLayout]="false"
  (rowsToRemove)="onRowsToRemove($event)"
  [selectable]="true"
  toolbarSize="small"
  scrollHeight="calc(100vh - 23.125rem)"
  toolbarTitle="Tree table with nested header and small toolbar">
  <ng-template #nestedHeader>
    <tr>
      <th rowspan="2" cpsTTHdrSelectable></th>
      <th colspan="2">Section 1</th>
      <th colspan="3">Section 2</th>
    </tr>
    <tr>
      <th cpsTTColSortable="name" cpsTTColFilter="name" filterType="text">
        Name
      </th>
      <th
        cpsTTColSortable="size"
        cpsTTColFilter="size"
        filterType="number">
        Size
      </th>
      <th
        cpsTTColSortable="modified"
        cpsTTColFilter="modified"
        filterType="date">
        Modified
      </th>
      <th
        cpsTTColSortable="encrypted"
        cpsTTColFilter="encrypted"
        filterType="boolean">
        Encrypted
      </th>
      <th
        cpsTTColSortable="importance"
        cpsTTColFilter="importance"
        filterType="category">
        Importance
      </th>
    </tr>
  </ng-template>
  <ng-template #body let-rowNode let-rowData="rowData">
    <td [cpsTTRowToggler]="rowNode">
      {{ rowData.name }}
    </td>
    <td>{{ rowData.size }}</td>
    <td>{{ rowData.modified | date }}</td>
    <td>
      <cps-icon
        [icon]="rowData.encrypted ? 'checked' : 'close-x'"
        [color]="
          rowData.encrypted
            ? 'var(--cps-color-success)'
            : 'var(--cps-color-error)'
        "
        size="small"
        [ariaLabel]="rowData.encrypted ? 'Encrypted' : 'Not encrypted'">
      </cps-icon>
    </td>
    <td>{{ rowData.importance }}</td>
  </ng-template>
</cps-tree-table>`,
      ts: `
${treeDataTs.trim()}

${removeElementsByNameTs.trim()}`
    },

    treeTable6: {
      html: `
<cps-tree-table
  [data]="data"
  [columns]="cols"
  [rowHover]="false"
  [bordered]="false"
  [sortable]="true"
  [showRowMenu]="true"
  [rowMenuItems]="customRowMenuItems"
  toolbarTitle="Borderless tree table without highlightning on rows hover. Row menu is shown and has custom items.">
  <ng-template #header>
    <th cpsTTColSortable="name">Name</th>
    <th cpsTTColSortable="size">Size</th>
    <th cpsTTColSortable="modified">Modified</th>
    <th cpsTTColSortable="encrypted">Encrypted</th>
    <th cpsTTColSortable="importance">Importance</th>
  </ng-template>

  <ng-template #body let-rowNode let-rowData="rowData">
    <td [cpsTTRowToggler]="rowNode">
      {{ rowData.name }}
    </td>
    <td>{{ rowData.size }}</td>
    <td>{{ rowData.modified | date }}</td>
    <td>
      <cps-icon
        [icon]="rowData.encrypted ? 'checked' : 'close-x'"
        [color]="
          rowData.encrypted
            ? 'var(--cps-color-success)'
            : 'var(--cps-color-error)'
        "
        size="small"
        [ariaLabel]="rowData.encrypted ? 'Encrypted' : 'Not encrypted'">
      </cps-icon>
    </td>
    <td>{{ rowData.importance }}</td>
  </ng-template>
</cps-tree-table>`,
      ts: `
${treeDataTs.trim()}

cols = [
  { field: 'name', header: 'Name' },
  { field: 'size', header: 'Size' },
  { field: 'modified', header: 'Modified' },
  { field: 'encrypted', header: 'Encrypted' },
  { field: 'importance', header: 'Importance' }
];

customRowMenuItems: CpsMenuItem[] = [
  {
    title: 'Custom menu item',
    icon: 'heart',
    action: (_) => {
      console.log('Custom menu item clicked');
    }
  },
  {
    title: 'Edit row',
    icon: 'edit',
    action: (_) => {
      this.onEditRowButtonClicked();
    }
  }
];

onEditRowButtonClicked() {
  alert('Edit row button clicked');
}`
    },

    treeTable7: {
      html: `
<cps-tree-table [data]="data" [size]="selSize">
  <ng-template #toolbar>
    <span>Tree table with custom toolbar and different sizes</span>
    <cps-button-toggle
      ariaLabel="Table size"
      [options]="sizesOptions"
      [(ngModel)]="selSize">
    </cps-button-toggle>
  </ng-template>
  <ng-template #header>
    <th cpsTTColSortable="name" cpsTTColFilter="name" filterType="text">
      Name
    </th>
    <th cpsTTColSortable="size" cpsTTColFilter="size" filterType="number">
      Size
    </th>
    <th
      cpsTTColSortable="modified"
      cpsTTColFilter="modified"
      filterType="date">
      Modified
    </th>
    <th
      cpsTTColSortable="encrypted"
      cpsTTColFilter="encrypted"
      filterType="boolean">
      Encrypted
    </th>
    <th
      cpsTTColSortable="importance"
      cpsTTColFilter="importance"
      filterType="category">
      Importance
    </th>
  </ng-template>

  <ng-template #body let-rowNode let-rowData="rowData">
    <td [cpsTTRowToggler]="rowNode">
      {{ rowData.name }}
    </td>
    <td>{{ rowData.size }}</td>
    <td>{{ rowData.modified | date }}</td>
    <td>
      <cps-icon
        [icon]="rowData.encrypted ? 'checked' : 'close-x'"
        [color]="
          rowData.encrypted
            ? 'var(--cps-color-success)'
            : 'var(--cps-color-error)'
        "
        size="small"
        [ariaLabel]="rowData.encrypted ? 'Encrypted' : 'Not encrypted'">
      </cps-icon>
    </td>
    <td>{{ rowData.importance }}</td>
  </ng-template>
</cps-tree-table>`,
      ts: `
${treeDataTs.trim()}

sizesOptions: CpsButtonToggleOption[] = [
  { label: 'Small', value: 'small' },
  { label: 'Normal', value: 'normal' },
  { label: 'Large', value: 'large' }
];

selSize: CpsTreeTableSize = 'small';`
    },

    treeTable8: {
      html: `
<cps-tree-table
  [data]="[]"
  toolbarTitle="Empty tree table"
  emptyBodyHeight="25rem">
  <ng-template #header>
    <th cpsTTColSortable="name">Name</th>
    <th cpsTTColSortable="size">Size</th>
    <th cpsTTColSortable="modified">Modified</th>
    <th cpsTTColSortable="encrypted">Encrypted</th>
    <th cpsTTColSortable="importance">Importance</th>
  </ng-template>
</cps-tree-table>`
    },

    treeTable9: {
      html: `
<cps-tree-table
  [data]="data"
  [loading]="true"
  scrollHeight="25rem"
  [columns]="cols"
  toolbarTitle="Tree table in data loading state">
</cps-tree-table>`,
      ts: `
${treeDataTs.trim()}

cols = [
  { field: 'name', header: 'Name' },
  { field: 'size', header: 'Size' },
  { field: 'modified', header: 'Modified' },
  { field: 'encrypted', header: 'Encrypted' },
  { field: 'importance', header: 'Importance' }
];`
    },

    treeTable10: {
      html: `
<cps-tree-table
  [data]="treeDataWithHTML"
  scrollHeight="25rem"
  [columns]="colsHTML"
  [renderDataAsHTML]="true"
  toolbarTitle="Table containing HTML">
</cps-tree-table>`,
      ts: `
treeDataWithHTML = [
  {
    data: {
      a: '<strong>hello</strong>',
      b: '<h2>world</h2>',
      c: '<a href="https://www.github.com">link to github</a>'
    },
    children: [
      {
        data: {
          a: 'this is sanitized <script>console.log("pwned")</script>',
          b: '<img src="./assets/ui_logo.svg" width="100" />',
          c: '<code>null === undefined</code>'
        }
      }
    ]
  }
];

colsHTML = [
  { field: 'a', header: 'Header A' },
  { field: 'b', header: 'Header B' },
  { field: 'c', header: 'Header C' }
];`
    }
  };
