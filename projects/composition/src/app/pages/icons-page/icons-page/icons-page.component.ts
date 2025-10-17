import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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

@Component({
  imports: [
    CpsIconComponent,
    CpsInputComponent,
    CommonModule,
    FormsModule,
    ComponentDocsViewerComponent
  ],
  selector: 'app-icons-page',
  templateUrl: './icons-page.component.html',
  styleUrls: ['./icons-page.component.scss'],
  host: { class: 'composition-page' }
})
export class IconsPageComponent implements OnInit {
  filteredIconsList: string[] = [];
  componentData = ComponentData;

  // eslint-disable-next-line no-useless-constructor
  constructor(private _notificationService: CpsNotificationService) {}

  ngOnInit() {
    this.filteredIconsList = iconNames;
  }

  onSearchChanged(value: string | number) {
    this._filterIcons(String(value));
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
          `Icon ${name} copied to clipboard`,
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
