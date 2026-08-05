import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CpsCheckboxComponent, CpsPaginatorComponent } from 'cps-ui-kit';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';
import { CodeExampleComponent } from '../../components/code-example/code-example.component';
import ComponentData from '../../api-data/cps-paginator.json';
import { paginatorExamples } from './paginator-page.examples';

@Component({
  selector: 'app-paginator-page',
  imports: [
    FormsModule,
    CpsPaginatorComponent,
    CpsCheckboxComponent,
    ComponentDocsViewerComponent,
    CodeExampleComponent
  ],
  templateUrl: './paginator-page.component.html',
  styleUrls: ['./paginator-page.component.scss'],
  host: { class: 'composition-page' }
})
export class PaginatorPageComponent {
  componentData = ComponentData;
  readonly examples = paginatorExamples;

  first = 0;
  rows = 10;
  manyRecords = false;

  onPageChanged(event: { first: number; rows: number }) {
    this.first = event.first;
    this.rows = event.rows;
  }
}
