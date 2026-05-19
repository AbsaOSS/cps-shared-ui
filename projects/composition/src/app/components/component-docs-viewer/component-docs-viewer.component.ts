import { Component, Input } from '@angular/core';
import {
  ComponentAPI,
  EnumsAPI,
  InterfaceAPI,
  TypesAPI
} from '../../models/component-api.model';
import { ServiceAPI } from '../../models/service-api.model';
import {
  CpsTabComponent,
  CpsTabGroupComponent,
  CpsTooltipDirective
} from 'cps-ui-kit';
import { ObjectEntriesPipe } from '../../pipes/object-entries.pipe';

import TypesMap from '../../api-data/types_map.json';
import { ViewerComponent } from '../viewer/viewer.component';
import { EnumsComponent } from '../shared/enums/enums.component';
import { ApiTypeComponent } from '../shared/api-type/api-type.component';

@Component({
  selector: 'app-component-docs-viewer',
  templateUrl: './component-docs-viewer.component.html',
  styleUrl: './component-docs-viewer.component.scss',
  imports: [
    CpsTabComponent,
    CpsTabGroupComponent,
    ObjectEntriesPipe,
    ApiTypeComponent,
    EnumsComponent,
    CpsTooltipDirective
  ]
})
export class ComponentDocsViewerComponent extends ViewerComponent {
  @Input() componentData?: {
    components: { [key: string]: ComponentAPI };
    types?: TypesAPI;
    interfaces?: InterfaceAPI;
    enums?: EnumsAPI;
  };

  @Input() services?: ServiceAPI[];

  TypesMap: Record<string, string> = TypesMap;

  override ngOnInit(): void {
    if (!this.componentData) {
      throw new Error('Input property componentData is required');
    }
    super.ngOnInit();
  }
}
