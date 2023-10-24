import { CommonModule } from '@angular/common';
import { Component, Input, TemplateRef, ViewChild } from '@angular/core';

/**
 * CpsTabComponent is a navigation component that displays items as tab headers.
 * @group Components
 */
@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'cps-tab',
  templateUrl: './cps-tab.component.html',
  styleUrls: ['./cps-tab.component.scss']
})
export class CpsTabComponent {
  /**
   * Label of the tab component.
   * @group Props
   */
  @Input() label = '';
  /**
   * Icon before input value.
   * @group Props
   */
  @Input() icon = '';

  /**
   * If it is true, it specifies that the component should be disabled.
   * @group Props
   */
  @Input() disabled = false;
  /**
   *When it is not an empty string, text field is displayed to show text for more info.
   * @group Props
   */
  @Input() tooltipText = '';
  /**
   * Info tooltip class for styling.
   * @group Props
   */
  @Input() tooltipContentClass = 'cps-tooltip-content';
  /**
   * Width of Tooltip, of type number or string.
   * @group Props
   */
  @Input() tooltipMaxWidth: number | string = '100%';
  /**
   * Whether the tooltip should have persistent info.
   * @group Props
   */
  @Input() tooltipPersistent = false;
  @ViewChild(TemplateRef) content!: TemplateRef<any>;
  active = false;
}
