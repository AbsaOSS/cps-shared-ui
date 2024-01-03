import { Component, Input } from '@angular/core';
import { CpsIconComponent, iconSizeType } from '../cps-icon/cps-icon.component';
import {
  CpsTooltipDirective,
  CpsTooltipPosition
} from '../../directives/cps-tooltip.directive';

/**
 * CpsInfoCircleComponent is a component that provides information by means of the info icon with the tooltip on hover.
 * @group Components
 */
@Component({
  selector: 'cps-info-circle',
  standalone: true,
  imports: [CpsIconComponent, CpsTooltipDirective],
  templateUrl: './cps-info-circle.component.html',
  styleUrls: ['./cps-info-circle.component.scss']
})
export class CpsInfoCircleComponent {
  /**
   * Size of the icon, it can be of type number denoting pixels, string or 'fill', 'xsmall', 'small', 'normal' or 'large'.
   * @group Props
   */
  @Input() size: iconSizeType = 'small';

  /**
   * Tooltip text to provide more info.
   * @group Props
   */
  @Input() tooltipText = '';

  /**
   * Position of the tooltip, it can be 'top', 'bottom', 'left' or 'right'.
   * @group Props
   */
  @Input() tooltipPosition: CpsTooltipPosition = 'top';

  /**
   * Info tooltip class for styling.
   * @group Props
   */
  @Input() tooltipContentClass = 'cps-tooltip-content';

  /**
   * Max width of the tooltip of type number denoting pixels or string.
   * @group Props
   */
  @Input() tooltipMaxWidth: number | string = '100%';

  /**
   * Determines whether the tooltip is persistent.
   * @group Props
   */
  @Input() tooltipPersistent = false;
}
