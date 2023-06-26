import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'cps-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cps-table.component.html',
  styleUrls: ['./cps-table.component.scss']
})
export class CpsTableComponent {
  @Input() headers: string[] = [];
  @Input() data: any[] = [];
  @Input() striped = false;
  @Input() bordered = false;
  @Input() size: 'small' | 'default' = 'default';
  @Input() selectable = false;
  @Input() emptyMessage = 'No data';
  @Input() virtualScroll = false;
  @Input() hasToolbar = false;
  @Input() toolbarTitle = '';
  @Input() export = false;
}
