import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CpsTableComponent } from 'cps-ui-kit';

@Component({
  selector: 'app-table-page',
  standalone: true,
  imports: [CommonModule, CpsTableComponent],
  templateUrl: './table-page.component.html',
  styleUrls: ['./table-page.component.scss'],
  host: { class: 'composition-page' }
})
export class TablePageComponent {}
