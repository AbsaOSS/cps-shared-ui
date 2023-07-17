import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ContentChild,
  EventEmitter,
  Input,
  OnInit,
  Output,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Table, TableService, TableModule } from 'primeng/table';
import { TableUnsortDirective } from './table-unsort.directive';
import { SortEvent } from 'primeng/api';
import { CpsInputComponent } from '../cps-input/cps-input.component';

export function tableFactory(tableComponent: CpsTableComponent) {
  return tableComponent.primengTable;
}

@Component({
  selector: 'cps-table',
  standalone: true,
  imports: [CommonModule, TableModule, TableUnsortDirective, CpsInputComponent],
  templateUrl: './cps-table.component.html',
  styleUrls: ['./cps-table.component.scss'],
  providers: [
    TableService,
    {
      provide: Table,
      useFactory: tableFactory,
      // eslint-disable-next-line no-use-before-define
      deps: [CpsTableComponent]
    }
  ]
})
export class CpsTableComponent implements OnInit, AfterViewInit {
  @Input() headers: string[] = [];
  @Input() data: any[] = [];
  @Input() columns: { [key: string]: any }[] = []; // combines both headers and data
  @Input() striped = true;
  @Input() bordered = true;
  @Input() size: 'small' | 'normal' | 'large' = 'normal';
  @Input() selectable = true;
  @Input() emptyMessage = 'No data';
  @Input() hasToolbar = true;
  @Input() toolbarSize: 'small' | 'normal' = 'normal';
  @Input() toolbarTitle = '';
  @Input() sortMode: 'single' | 'multiple' = 'multiple';
  @Input() customSort = false;
  @Input() rowHover = true;
  @Input() scrollable = true;
  @Input() virtualScroll = false; // works only if scrollable is true

  @Input() showGlobalFilter = false;
  @Input() globalFilterPlaceholder = 'Search';
  @Input() globalFilterFields: string[] = [];

  // @Input() showRemoveOnSelect = true; // TODO

  // @Input() draggableRows = false; TODO
  // @Input() columnsToggle = false; TODO
  // @Input() export = false; TODO
  /* @Input() */ resizableColumns = false; // TODO
  /* @Input() */ reorderableColumns = false; // TODO
  // TODO CpsTableColumnFilterDirective (type date, text, boolean, range, categories, numeric)

  @Output() selectionChanged = new EventEmitter<any[]>();

  /**
   * A function to implement custom sorting. customSort must be true.
   * @param {any} any - sort meta.
   * @group Emits
   */
  @Output() customSortFunction: EventEmitter<any> = new EventEmitter<any>();

  styleClass = '';
  selectedRows: any[] = [];

  virtualScrollItemSize = 0;

  // eslint-disable-next-line no-useless-constructor
  constructor(private cdRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (!this.scrollable) this.virtualScroll = false;
    if (
      this.showGlobalFilter &&
      this.globalFilterFields?.length < 1 &&
      this.data?.length > 0
    ) {
      this.globalFilterFields = Object.keys(this.data[0]);
    }
    switch (this.size) {
      case 'small':
        this.styleClass = 'p-datatable-sm';
        break;
      case 'large':
        this.styleClass = 'p-datatable-lg';
        break;
    }
    switch (this.toolbarSize) {
      case 'small':
        this.styleClass += ' cps-tbar-small';
        break;
      case 'normal':
        this.styleClass += ' cps-tbar-normal';
        break;
    }
    if (this.striped) {
      this.styleClass += ' p-datatable-striped';
    }
    if (this.bordered) {
      this.styleClass += ' p-datatable-gridlines';
    }
  }

  ngAfterViewInit() {
    this.virtualScrollItemSize =
      this.primengTable?.el?.nativeElement
        ?.querySelector('.p-datatable-tbody')
        ?.querySelector('tr')?.clientHeight || 0;
    this.cdRef.detectChanges();
  }

  onSelectionChanged(selection: any[]) {
    this.selectionChanged.emit(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      selection.map(({ _defaultSortOrder, ...rest }) => rest)
    );
  }

  onSortFunction(event: SortEvent) {
    this.customSortFunction.emit(event);
  }

  onFilterGlobal(value: string) {
    this.primengTable.filterGlobal(value, 'contains');
  }

  @ContentChild('toolbar', { static: false })
  public toolbarTemplate!: TemplateRef<any>;

  @ContentChild('header', { static: false })
  public headerTemplate!: TemplateRef<any>;

  @ContentChild('body', { static: false })
  public bodyTemplate!: TemplateRef<any>;

  @ViewChild('primengTable', { static: true })
  primengTable!: Table;
}
