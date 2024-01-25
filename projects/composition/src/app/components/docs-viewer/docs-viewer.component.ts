import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ComponentAPI } from '../../models/component-api.model';
import { CpsTabComponent, CpsTabGroupComponent } from 'cps-ui-kit';

@Component({
  selector: 'app-docs-viewer',
  templateUrl: './docs-viewer.component.html',
  styleUrl: './docs-viewer.component.scss',
  imports: [CommonModule, CpsTabComponent, CpsTabGroupComponent],
  standalone: true
})
export class DocsViewerComponent implements OnInit {
  @Input() componentData?: { components: { [key: string]: ComponentAPI } };
  objectEntries = Object.entries;

  ngOnInit(): void {
    if (!this.componentData) {
      throw new Error('Input property componentData is required');
    }
  }
}
