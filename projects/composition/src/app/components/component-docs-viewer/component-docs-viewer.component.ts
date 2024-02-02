import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ComponentAPI } from '../../models/component-api.model';
import { CpsTabComponent, CpsTabGroupComponent } from 'cps-ui-kit';

@Component({
  selector: 'app-component-docs-viewer',
  templateUrl: './component-docs-viewer.component.html',
  styleUrl: './component-docs-viewer.component.scss',
  imports: [CommonModule, CpsTabComponent, CpsTabGroupComponent],
  standalone: true
})
export class ComponentDocsViewerComponent implements OnInit {
  @Input() componentData?: { components: { [key: string]: ComponentAPI } };
  objectEntries = Object.entries;

  ngOnInit(): void {
    if (!this.componentData) {
      throw new Error('Input property componentData is required');
    }
  }
}
