import { Component, Input } from '@angular/core';
import { ServiceAPI } from '../../models/service-api.model';
import { CommonModule } from '@angular/common';
import { CpsTabComponent, CpsTabGroupComponent } from 'cps-ui-kit';
import { ViewerComponent } from '../viewer/viewer.component';

@Component({
  selector: 'app-service-docs-viewer',
  templateUrl: './service-docs-viewer.component.html',
  styleUrl: './service-docs-viewer.component.scss',
  standalone: true,
  imports: [CommonModule, CpsTabComponent, CpsTabGroupComponent]
})
export class ServiceDocsViewerComponent extends ViewerComponent {
  @Input() serviceData?: ServiceAPI;

  override ngOnInit(): void {
    if (!this.serviceData) {
      throw new Error('Input property serviceData is required');
    }
    super.ngOnInit();
  }

  parseParameters(
    parameters?: { name: string; type: string; description?: string }[]
  ): string {
    if (!parameters) {
      return '';
    }
    return parameters.map((param) => `${param.name}: ${param.type}`).join(', ');
  }
}
