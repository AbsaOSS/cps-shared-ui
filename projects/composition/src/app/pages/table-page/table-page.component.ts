import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CpsTableComponent } from 'cps-ui-kit';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-table-page',
  standalone: true,
  imports: [CommonModule, CpsTableComponent, TableModule],
  templateUrl: './table-page.component.html',
  styleUrls: ['./table-page.component.scss'],
  host: { class: 'composition-page' }
})
export class TablePageComponent {
  headers = ['A', 'B', 'C'];
  data = [
    { a: 'a1', b: 'b1', c: 0.0 },
    { a: 'a2', b: 'b2', c: 0.1 },
    { a: 'a3', b: 'b3', c: 0.2 },
    { a: 'a4', b: 'b4', c: 0.3 },
    { a: 'a5', b: 'b5', c: 0.4 },
    { a: 'a6', b: 'b6', c: 0.5 }
  ];
}
