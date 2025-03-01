import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  ComponentAPI,
  EnumsAPI,
  InterfaceAPI,
  TypesAPI
} from '../../models/component-api.model';
import { CpsTabComponent, CpsTabGroupComponent } from 'cps-ui-kit';
import { ObjectEntriesPipe } from '../../pipes/object-entries.pipe';

import TypesMap from '../../api-data/types_map.json';
import { RouterModule } from '@angular/router';
import { ViewerComponent } from '../viewer/viewer.component';
import { DetectTypePipe } from '../../pipes/detect-type.pipe';
import { EnumsComponent } from '../shared/enums/enums.component';

@Component({
  selector: 'app-component-docs-viewer',
  templateUrl: './component-docs-viewer.component.html',
  styleUrl: './component-docs-viewer.component.scss',
  imports: [
    CommonModule,
    CpsTabComponent,
    CpsTabGroupComponent,
    ObjectEntriesPipe,
    RouterModule,
    DetectTypePipe,
    EnumsComponent
  ]
})
export class ComponentDocsViewerComponent extends ViewerComponent {
  @Input() componentData?: {
    components: { [key: string]: ComponentAPI };
    types?: TypesAPI;
    interfaces?: InterfaceAPI;
    enums?: EnumsAPI;
  };

  TypesMap: Record<string, string> = TypesMap;

  override ngOnInit(): void {
    if (!this.componentData) {
      throw new Error('Input property componentData is required');
    }
    super.ngOnInit();
  }
}
