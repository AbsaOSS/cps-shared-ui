import { Component, Input } from '@angular/core';
import { ServiceAPI } from '../../models/service-api.model';
import { CommonModule } from '@angular/common';
import {
  CpsTabComponent,
  CpsTabGroupComponent,
  CpsTooltipDirective
} from 'cps-ui-kit';
import { ViewerComponent } from '../viewer/viewer.component';
import TypesMap from '../../api-data/types_map.json';
import { RouterLink } from '@angular/router';
import { DetectTypePipe } from '../../pipes/detect-type.pipe';
import { EnumsComponent } from '../shared/enums/enums.component';

@Component({
  selector: 'app-service-docs-viewer',
  templateUrl: './service-docs-viewer.component.html',
  styleUrl: './service-docs-viewer.component.scss',
  imports: [
    CommonModule,
    CpsTabComponent,
    CpsTabGroupComponent,
    RouterLink,
    DetectTypePipe,
    CpsTooltipDirective,
    EnumsComponent
  ]
})
export class ServiceDocsViewerComponent extends ViewerComponent {
  @Input() serviceData?: ServiceAPI;
  TypesMap: Record<string, string> = TypesMap;

  override ngOnInit(): void {
    if (!this.serviceData) {
      throw new Error('Input property serviceData is required');
    }
    super.ngOnInit();
  }

  parseParameters(
    parameters?: {
      name: string;
      type: string;
      description?: string;
      defaultValue?: string;
    }[]
  ): string {
    if (!parameters) {
      return '';
    }
    return parameters
      .map(
        (param) =>
          `${param.name}: ${param.type}${param.defaultValue ? ' = ' + param.defaultValue : ''}`
      )
      .join(', ');
  }
}
