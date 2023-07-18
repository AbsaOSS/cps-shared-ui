import { Component } from '@angular/core';
import { CpsPaginatorComponent } from 'cps-ui-kit';

@Component({
  selector: 'app-paginator-page',
  standalone: true,
  imports: [CpsPaginatorComponent],
  templateUrl: './paginator-page.component.html',
  styleUrls: ['./paginator-page.component.scss'],
  host: { class: 'composition-page' }
})
export class PaginatorPageComponent {}
