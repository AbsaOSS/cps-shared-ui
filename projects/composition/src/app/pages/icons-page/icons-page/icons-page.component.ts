import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CpsIconComponent,
  CpsInputComponent,
  CpsNotificationPosition,
  CpsNotificationService,
  iconNames
} from 'cps-ui-kit';

import ComponentData from '../../../api-data/cps-icon.json';
import { ComponentDocsViewerComponent } from '../../../components/component-docs-viewer/component-docs-viewer.component';
import { CodeExampleComponent } from '../../../components/code-example/code-example.component';
import { iconsExamples } from './icons-page.examples';

@Component({
  imports: [
    CpsIconComponent,
    CpsInputComponent,
    FormsModule,
    ComponentDocsViewerComponent,
    CodeExampleComponent
  ],
  selector: 'app-icons-page',
  templateUrl: './icons-page.component.html',
  styleUrls: ['./icons-page.component.scss'],
  host: { class: 'composition-page' }
})
export class IconsPageComponent implements OnInit {
  filteredIconsList: string[] = [];
  componentData = ComponentData;
  readonly examples = iconsExamples;

  private _notificationService = inject(CpsNotificationService);

  ngOnInit() {
    this.filteredIconsList = iconNames;
  }

  onSearchChanged(value: string) {
    this._filterIcons(value);
  }

  private _filterIcons(name: string) {
    name = name.toLowerCase();
    this.filteredIconsList = iconNames.filter((n) =>
      n.toLowerCase().includes(name)
    );
  }

  onCopyIconName(name: string) {
    navigator.clipboard.writeText(name).then(
      () => {
        this._notificationService.success(
          `Icon "${name}" copied to clipboard`,
          undefined,
          { position: CpsNotificationPosition.BOTTOM, timeout: 1000 }
        );
      },
      () => {
        this._notificationService.error('Failed to copy icon name', undefined, {
          position: CpsNotificationPosition.BOTTOM,
          timeout: 1000
        });
      }
    );
  }
}
