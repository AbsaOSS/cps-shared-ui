import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CpsButtonComponent, CpsLoaderComponent } from 'cps-ui-kit';
import { DocsViewerComponent } from '../../components/docs-viewer/docs-viewer.component';

import ComponentData from '../../api-data/cps-loader.json';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    CpsLoaderComponent,
    CpsButtonComponent,
    DocsViewerComponent
  ],
  selector: 'app-loader-page',
  templateUrl: './loader-page.component.html',
  styleUrls: ['./loader-page.component.scss'],
  host: { class: 'composition-page' }
})
export class LoaderPageComponent {
  fullScreenOpened = false;
  componentData = ComponentData;

  onFullScreenClick() {
    this.fullScreenOpened = true;
    setTimeout(() => {
      this.fullScreenOpened = false;
    }, 3000);
  }
}
