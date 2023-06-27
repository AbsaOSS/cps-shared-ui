import {
  AfterViewInit,
  Component,
  ContentChild,
  Input,
  OnInit,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Table, TableService, TableModule } from 'primeng/table';
// import { PrimeTemplate } from 'primeng/api';
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
  @Input() striped = false;
  @Input() bordered = true;
  @Input() size: 'small' | 'normal' | 'large' = 'normal';
  @Input() selectable = false;
  @Input() emptyMessage = 'No data';
  @Input() virtualScroll = false;
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

  styleClass = '';

  // @ContentChildren(PrimeTemplate) templates!: QueryList<TemplateRef<any>>;

  // bodyTemplate!: TemplateRef<any>;

  ngOnInit(): void {
    switch (this.size) {
      case 'small':
        this.styleClass = 'p-datatable-sm';
        break;
      case 'large':
        this.styleClass = 'p-datatable-lg';
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
    // debugger;
    // this.templates.forEach((item) => {
    //   switch (item.getType()) {
    //     case 'body':
    //       this.bodyTemplate = item.template;
    //       break;
    //   }
    // });
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
