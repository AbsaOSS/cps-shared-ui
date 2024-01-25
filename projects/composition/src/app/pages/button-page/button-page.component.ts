import { Component } from '@angular/core';
import { CpsButtonComponent } from 'cps-ui-kit';
import { DocsViewerComponent } from '../../components/docs-viewer/docs-viewer.component';

import ComponentData from '../../api-data/cps-button.json';

@Component({
  standalone: true,
  imports: [CpsButtonComponent, DocsViewerComponent],
  selector: 'app-button-page',
  templateUrl: './button-page.component.html',
  styleUrls: ['./button-page.component.scss'],
  host: { class: 'composition-page' }
})
export class ButtonPageComponent {
  componentData = ComponentData;
  isLoading = false;
  onClickForLoading() {
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
    }, 2000);
  }
}
