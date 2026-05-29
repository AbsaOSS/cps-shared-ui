import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnInit,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { logMissingAriaLabelError } from '../../../utils/internal/accessibility-utils';

/**
 * CpsTabComponent is a tab within a tab-group.
 * @group Components
 */
@Component({
  imports: [CommonModule],
  selector: 'cps-tab',
  templateUrl: './cps-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CpsTabComponent implements OnInit, OnChanges {
  /**
   * Label of the tab.
   * @group Props
   */
  @Input() label = '';

  /**
   * Aria label for the tab component, used for accessibility, it takes precedence over label.
   * @group Props
   */
  @Input() ariaLabel = '';

  /**
   * Icon before the label.
   * @group Props
   */
  @Input() icon = '';

  /**
   * Determines whether tab is disabled.
   * @group Props
   */
  @Input() disabled = false;

  /**
   * Determines whether to show the tooltip on tab hover.
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
   * Determines whether the tooltip should have persistent info.
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

  ngOnInit(): void {
    logMissingAriaLabelError('CpsTabComponent', this.label, this.ariaLabel);
  }

  ngOnChanges(): void {
    logMissingAriaLabelError('CpsTabComponent', this.label, this.ariaLabel);
  }
}
