import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CpsButtonComponent, CpsChipComponent } from 'cps-ui-kit';

import ComponentData from '../../api-data/cps-chip.json';
import { DocsViewerComponent } from '../../components/docs-viewer/docs-viewer.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    CpsChipComponent,
    CpsButtonComponent,
    DocsViewerComponent
  ],
  selector: 'app-chip-page',
  templateUrl: './chip-page.component.html',
  styleUrls: ['./chip-page.component.scss'],
  host: { class: 'composition-page' }
})
export class ChipPageComponent {
  chipClosed = false;
  componentData = ComponentData;

  onToggleChip() {
    this.chipClosed = !this.chipClosed;
  }
}
