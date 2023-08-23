import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CpsTreeTableComponent } from 'cps-ui-kit';

@Component({
  selector: 'app-tree-table-page',
  standalone: true,
  imports: [CommonModule, CpsTreeTableComponent],
  templateUrl: './tree-table-page.component.html',
  styleUrls: ['./tree-table-page.component.scss'],
  host: { class: 'composition-page' }
})
export class TreeTablePageComponent {}
