import { Component, Input } from '@angular/core';
import { CpsIconComponent, iconSizeType } from '../cps-icon/cps-icon.component';
import {
  CpsTooltipDirective,
  CpsTooltipPosition
} from '../../directives/cps-tooltip.directive';

@Component({
  selector: 'cps-info-circle',
  standalone: true,
  imports: [CpsIconComponent, CpsTooltipDirective],
  templateUrl: './cps-info-circle.component.html',
  styleUrls: ['./cps-info-circle.component.scss']
})
export class CpsInfoCircleComponent {
  @Input() size: iconSizeType = 'small';
  @Input() tooltipText = '';
  @Input() tooltipPosition: CpsTooltipPosition = 'top';
  @Input() tooltipContentClass = 'cps-tooltip-content';
  @Input() tooltipMaxWidth: number | string = '100%';
  @Input() tooltipPersistent = false;
}
