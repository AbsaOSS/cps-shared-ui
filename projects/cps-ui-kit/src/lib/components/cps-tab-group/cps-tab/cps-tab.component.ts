import { CommonModule } from '@angular/common';
import { Component, Input, TemplateRef, ViewChild } from '@angular/core';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'cps-tab',
  templateUrl: './cps-tab.component.html',
  styleUrls: ['./cps-tab.component.scss']
})
export class CpsTabComponent {
  @Input() label = '';
  @Input() icon = '';
  @Input() disabled = false;
  @Input() tooltipText = '';
  @Input() tooltipContentClass = 'cps-tooltip-content';
  @Input() tooltipMaxWidth: number | string = '100%';
  @Input() tooltipPersistent = false;
  @ViewChild(TemplateRef) content!: TemplateRef<any>;
  active = false;
}
