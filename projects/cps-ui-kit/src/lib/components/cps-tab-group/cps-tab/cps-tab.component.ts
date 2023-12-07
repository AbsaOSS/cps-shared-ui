import { CommonModule } from '@angular/common';
import { Component, Input, TemplateRef, ViewChild } from '@angular/core';

/**
 * CpsTabComponent is a tab within a tab-group.
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
   * Label of the tab.
   * @group Props
   */
  @Input() label = '';

  /**
   * Icon before the label.
   * @group Props
   */
  @Input() icon = '';

  /**
   * Whether tab is disabled.
   * @group Props
   */
  @Input() disabled = false;

  /**
   * Whether to show the tooltip on tab hover.
   * @group Props
   */
  @Input() tooltipText = '';

  /**
   * Class for styling the tab tooltip.
   * @group Props
   */
  @Input() tooltipContentClass = 'cps-tooltip-content';

  /**
   * Max width of the tooltip, of type number denoting pixels or string.
   * @group Props
   */
  @Input() tooltipMaxWidth: number | string = '100%';

  /**
   * Whether the tooltip should have persistent info.
   * @group Props
   */
  @Input() tooltipPersistent = false;

  /**
   * Badge value to show on the tab after the label in a form of a circle.
   * @group Props
   */
  @Input() badgeValue = '';

  /**
   * Tooltip text to show on badge hover.
   * @group Props
   */
  @Input() badgeTooltip = '';

  @ViewChild(TemplateRef) content!: TemplateRef<any>;

  active = false;
}
