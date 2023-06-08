import { Component } from '@angular/core';
import { CpsExpansionPanelComponent } from 'cps-ui-kit';

@Component({
  standalone: true,
  imports: [CpsExpansionPanelComponent],
  selector: 'app-expansion-panel-page',
  templateUrl: './expansion-panel-page.component.html',
  styleUrls: ['./expansion-panel-page.component.scss'],
  host: { class: 'composition-page' }
})
export class ExpansionPanelPageComponent {}
