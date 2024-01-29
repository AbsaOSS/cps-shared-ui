import { Component, Input, OnInit } from '@angular/core';
import { ServiceAPI } from '../../models/service-api.model';
import { CommonModule } from '@angular/common';
import { CpsTabComponent, CpsTabGroupComponent } from 'cps-ui-kit';

@Component({
  selector: 'app-service-docs-viewer',
  templateUrl: './service-docs-viewer.component.html',
  styleUrl: './service-docs-viewer.component.scss',
  standalone: true,
  imports: [CommonModule, CpsTabComponent, CpsTabGroupComponent]
})
export class ServiceDocsViewerComponent implements OnInit {
  @Input() componentData?: { components: { [key: string]: ServiceAPI } };
  objectEntries = Object.entries;

  ngOnInit(): void {
    if (!this.componentData) {
      throw new Error('Input property componentData is required');
    }
  }
}
