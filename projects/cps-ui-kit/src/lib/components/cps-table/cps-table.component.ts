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

export function tableFactory(tableComponent: CpsTableComponent) {
  return tableComponent.primengTable;
}

@Component({
  selector: 'cps-table',
  standalone: true,
  imports: [CommonModule, TableModule, TableUnsortDirective],
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
  @Input() striped = true;
  @Input() bordered = true;
  @Input() size: 'small' | 'normal' | 'large' = 'normal';
  @Input() selectable = true;
  @Input() emptyMessage = 'No data';
  @Input() virtualScroll = true;
  @Input() hasToolbar = false;
  @Input() toolbarTitle = '';
  @Input() sortMode: 'single' | 'multiple' = 'single';
  @Input() frozenRows: string[] = [];
  @Input() frozenColumns: string[] = [];
  @Input() resizableColumns = false;
  @Input() reorderableColumns = true;
  @Input() columnToggles = false;
  @Input() export = false;
  @Input() rowHover = true;
  @Input() scrollable = true;
  @Input() toolbarSize: 'small' | 'normal' = 'normal';

  @Output() selectionChanged = new EventEmitter<any[]>();

  styleClass = '';
  selectedRows = [];

  virtualScrollItemSize = 0;

  // eslint-disable-next-line no-useless-constructor
  constructor(private cdRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (!this.scrollable) this.virtualScroll = false;
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

  onSelectionChanged() {
    this.selectionChanged.emit();
  }

  @ContentChild('caption', { static: false })
  public captionTemplate!: TemplateRef<any>;

  @ContentChild('header', { static: false })
  public headerTemplate!: TemplateRef<any>;

  @ContentChild('body', { static: false })
  public bodyTemplate!: TemplateRef<any>;

  @ViewChild('primengTable', { static: true })
  primengTable!: Table;
}
