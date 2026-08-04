import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import {
  CpsButtonComponent,
  CpsChipComponent,
  CpsFocusService,
  CpsNotificationService
} from 'cps-ui-kit';

import ComponentData from '../../api-data/cps-chip.json';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';
import { CodeExampleComponent } from '../../components/code-example/code-example.component';
import { chipExamples } from './chip-page.examples';

@Component({
  imports: [
    CpsChipComponent,
    CpsButtonComponent,
    ComponentDocsViewerComponent,
    CodeExampleComponent
  ],
  selector: 'app-chip-page',
  templateUrl: './chip-page.component.html',
  styleUrls: ['./chip-page.component.scss'],
  host: { class: 'composition-page' }
})
export class ChipPageComponent {
  private readonly _notifService = inject(CpsNotificationService);
  private readonly _focusService = inject(CpsFocusService);

  @ViewChild('closableChipRef', { read: ElementRef })
  closableChipRef?: ElementRef<HTMLElement>;

  @ViewChild('resetChipBtnRef', { read: ElementRef })
  resetChipBtnRef?: ElementRef<HTMLElement>;

  chipClosed = false;
  componentData = ComponentData;

  readonly examples = chipExamples;

  onToggleChip() {
    this.chipClosed = !this.chipClosed;

    setTimeout(() => {
      const el = this.chipClosed
        ? this.resetChipBtnRef?.nativeElement.querySelector<HTMLElement>(
            'button'
          )
        : this.closableChipRef?.nativeElement.querySelector<HTMLElement>(
            '.cps-chip-close-btn'
          );

      if (el) {
        this._focusService.focusElement(el, this._focusService.isKeyboard());
      }
    });
  }

  onDismissChip() {
    this._notifService.info('Chip dismissed');
  }
}
