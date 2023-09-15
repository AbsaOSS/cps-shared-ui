import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CpsTreeTableComponent,
  CpsTreetableRowTogglerDirective,
  CpsTreeTableColumnSortableDirective,
  CpsTreeTableColumnFilterDirective,
  TabChangeEvent,
  CpsTabComponent,
  CpsTabGroupComponent,
  CpsButtonToggleComponent
} from 'cps-ui-kit';

@Component({
  selector: 'app-tree-table-page',
  standalone: true,
  imports: [
    CommonModule,
    CpsTreeTableComponent,
    CpsTreetableRowTogglerDirective,
    CpsTreeTableColumnSortableDirective,
    CpsTreeTableColumnFilterDirective,
    CpsTabGroupComponent,
    CpsTabComponent,
    CpsButtonToggleComponent
  ],
  templateUrl: './tree-table-page.component.html',
  styleUrls: ['./tree-table-page.component.scss'],
  host: { class: 'composition-page' }
})
export class TreeTablePageComponent implements OnInit {
  selectedTabIndex = 0;

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
                modified: new Date(2020, 1, 11),
                encrypted: true,
                importance: 'critical',
                children: [
                  {
                    data: {
                      name: 'angular.app',
                      size: 10,
                      modified: new Date(2021, 3, 14),
                      encrypted: true,
                      importance: 'critical'
                    }
                  },
                  {
                    data: {
                      name: 'cli.app',
                      size: 10,
                      modified: new Date(2021, 2, 11),
                      encrypted: true,
                      importance: 'critical'
                    }
                  },
                  {
                    data: {
                      name: 'mobile.app',
                      size: 5,
                      modified: new Date(2021, 1, 30),
                      encrypted: true,
                      importance: 'critical'
                    }
                  }
                ]
              }
            },
            {
              data: {
                name: 'cli.app',
                size: 10,
                modified: new Date(2019, 2, 11),
                encrypted: true,
                importance: 'critical'
              }
            },
            {
              data: {
                name: 'mobile.app',
                size: 50,
                modified: new Date(2018, 9, 13),
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
        },
        {
          data: {
            name: 'settings.app',
            size: 45,
            modified: new Date(2017, 10, 29),
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
    },
    {
      data: {
        name: 'Desktop',
        size: 150,
        modified: new Date(2023, 8, 13),
        encrypted: false,
        importance: 'essential'
      },
      children: [
        {
          data: {
            name: 'note-meeting.txt',
            size: 50,
            modified: new Date(2020, 5, 14),
            encrypted: true,
            importance: 'essential'
          }
        },
        {
          data: {
            name: 'note-todo.txt',
            size: 100,
            modified: new Date(2021, 4, 16),
            encrypted: false,
            importance: 'essential'
          }
        }
      ]
    },
    {
      data: {
        name: 'Documents',
        size: 75,
        modified: new Date(2023, 6, 17),
        encrypted: true,
        importance: 'critical'
      },
      children: [
        {
          data: {
            name: 'Work',
            size: 80,
            modified: new Date(2022, 3, 22),
            encrypted: false,
            importance: 'critical'
          },
          children: [
            {
              data: {
                name: 'Expenses.doc',
                size: 20,
                modified: new Date(2020, 7, 12),
                encrypted: false,
                importance: 'critical'
              }
            },
            {
              data: {
                name: 'Resume.doc',
                size: 200,
                modified: new Date(2021, 3, 18),
                encrypted: true,
                importance: 'critical'
              }
            }
          ]
        },
        {
          data: {
            name: 'Home',
            size: 20,
            modified: new Date(2023, 4, 19),
            encrypted: true,
            importance: 'critical'
          },
          children: [
            {
              data: {
                name: 'Invoices',
                size: 10,
                modified: new Date(2022, 8, 16),
                encrypted: false,
                importance: 'critical'
              }
            }
          ]
        }
      ]
    },
    {
      data: {
        name: 'Downloads',
        size: 50,
        modified: new Date(2023, 1, 17),
        encrypted: false,
        importance: 'optional'
      },
      children: [
        {
          data: {
            name: 'Spanish',
            size: 100,
            modified: new Date(2020, 5, 19),
            encrypted: true,
            importance: 'optional'
          },
          children: [
            {
              data: {
                name: 'tutorial-a1.txt',
                size: 12,
                modified: new Date(2021, 8, 17),
                encrypted: false,
                importance: 'optional'
              }
            },
            {
              data: {
                name: 'tutorial-a2.txt',
                size: 200,
                modified: new Date(2019, 3, 19),
                encrypted: false,
                importance: 'optional'
              }
            }
          ]
        },
        {
          data: {
            name: 'Travel',
            size: 11,
            modified: new Date(2023, 1, 23),
            encrypted: true,
            importance: 'optional'
          },
          children: [
            {
              data: {
                name: 'Hotel.pdf',
                size: 18,
                modified: new Date(2021, 4, 17),
                encrypted: false,
                importance: 'optional'
              }
            },
            {
              data: {
                name: 'Flight.pdf',
                size: 14,
                modified: new Date(2020, 3, 12),
                encrypted: true,
                importance: 'optional'
              }
            }
          ]
        }
      ]
    },
    {
      data: {
        name: 'Main',
        size: 90,
        modified: new Date(2022, 1, 16),
        encrypted: true,
        importance: 'essential'
      },
      children: [
        {
          data: {
            name: 'bin',
            size: 25,
            modified: new Date(2020, 4, 12),
            encrypted: true,
            importance: 'essential'
          }
        },
        {
          data: {
            name: 'etc',
            size: 80,
            modified: new Date(2023, 3, 15),
            encrypted: false,
            importance: 'essential'
          }
        },
        {
          data: {
            name: 'var',
            size: 210,
            modified: new Date(2020, 3, 14),
            encrypted: true,
            importance: 'essential'
          }
        }
      ]
    },
    {
      data: {
        name: 'Other',
        size: 8,
        modified: new Date(2020, 3, 3),
        encrypted: true,
        importance: 'optional'
      },
      children: [
        {
          data: {
            name: 'todo.txt',
            size: 30,
            modified: new Date(2020, 4, 17),
            encrypted: false,
            importance: 'optional'
          }
        },
        {
          data: {
            name: 'logo.png',
            size: 1,
            modified: new Date(2022, 4, 17),
            encrypted: false,
            importance: 'optional'
          }
        }
      ]
    },
    {
      data: {
        name: 'Pictures',
        size: 240,
        modified: new Date(2020, 9, 13),
        encrypted: true,
        importance: 'essential'
      },
      children: [
        {
          data: {
            name: 'barcelona.jpg',
            size: 60,
            modified: new Date(2022, 4, 11),
            encrypted: false,
            importance: 'essential'
          }
        },
        {
          data: {
            name: 'primeng.png',
            size: 12,
            modified: new Date(2021, 5, 12),
            encrypted: false,
            importance: 'essential'
          }
        },
        {
          data: {
            name: 'prime.jpg',
            size: 11,
            modified: new Date(2020, 6, 19),
            encrypted: false,
            importance: 'essential'
          }
        }
      ]
    },
    {
      data: {
        name: 'Videos',
        size: 300,
        modified: new Date(2023, 1, 12),
        encrypted: true,
        importance: 'optional'
      },
      children: [
        {
          data: {
            name: 'primefaces.mkv',
            size: 1000,
            modified: new Date(2020, 6, 23),
            encrypted: false,
            importance: 'optional'
          }
        },
        {
          data: {
            name: 'intro.avi',
            size: 500,
            modified: new Date(2020, 5, 13),
            encrypted: false,
            importance: 'optional'
          }
        }
      ]
    }
  ];

  cols = [
    { field: 'name', header: 'Name' },
    { field: 'size', header: 'Size' },
    { field: 'modified', header: 'Modified' },
    { field: 'encrypted', header: 'Encrypted' },
    { field: 'importance', header: 'Importance' }
  ];

  colsWithFilterType = [
    { field: 'name', header: 'Name', filterType: 'text' },
    { field: 'size', header: 'Size', filterType: 'number' },
    { field: 'modified', header: 'Modified', filterType: 'date' },
    { field: 'encrypted', header: 'Encrypted', filterType: 'boolean' },
    { field: 'importance', header: 'Importance', filterType: 'category' }
  ];

  colsVirtual = [
    { field: 'name', header: 'Name' },
    { field: 'size', header: 'Size' },
    { field: 'tag', header: 'Tag' }
  ];

  selCols: { [key: string]: any }[] = [];

  dataVirtual: any[] = [];

  ngOnInit(): void {
    this.selCols = this.cols;
    this._genVirtualData();
  }

  private _genVirtualData() {
    for (let i = 0; i <= 1000; i++) {
      this.dataVirtual.push({
        data: {
          name: `Folder${i}`,
          size: i,
          tag: i * 3
        },
        children: [
          {
            data: {
              name: 'primefaces.mkv',
              size: 1000,
              tag: 7
            }
          },
          {
            data: {
              name: 'intro.avi',
              size: 500,
              tag: 9
            }
          }
        ]
      });
    }
  }

  onColumnsSelected(columns: any) {
    this.selCols = columns;
  }

  onActionBtnClicked() {
    alert('Action button clicked');
  }

  onReloadBtnClicked() {
    alert('Data reload button clicked');
  }

  onEditRowButtonClicked() {
    alert('Edit row button clicked');
  }

  changeTab({ currentTabIndex }: TabChangeEvent) {
    this.selectedTabIndex = currentTabIndex;
  }
}
