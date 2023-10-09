import { Component, Input } from '@angular/core';
import { CpsIconComponent, iconSizeType } from '../cps-icon/cps-icon.component';
import {
  CpsTooltipDirective,
  TooltipPosition
} from '../../directives/cps-tooltip.directive';

@Component({
  selector: 'cps-info-circle',
  standalone: true,
  imports: [CpsIconComponent, CpsTooltipDirective],
  templateUrl: './cps-info-circle.component.html',
  styleUrls: ['./cps-info-circle.component.scss']
})
export class CpsInfoCircleComponent {
  /**
   * Size of the icon.
   * @group Props
   */
  @Input() size: iconSizeType = 'small';

  /**
   *Tooltip text to provide more info.
   * @group Props
   */
  @Input() tooltipText = '';

  /**
   * Position of the tooltip.
   * @group Props
   */
  @Input() tooltipPosition: TooltipPosition = 'top';

  @Input() tooltipContentClass = 'cps-tooltip-content';

  /**
   * Max width of the tooltip.
   * @group Props
   */
  @Input() tooltipMaxWidth: number | string = '100%';
  @Input() tooltipPersistent = false;
}
