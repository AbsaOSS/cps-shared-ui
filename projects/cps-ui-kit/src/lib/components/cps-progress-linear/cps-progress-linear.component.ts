import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { convertSize } from '../../utils/internal/size-utils';
import { getCSSColor } from '../../utils/colors-utils';

/**
 * CpsProgressLinearComponent is a process status indicator of a rectangular form.
 * @group Components
 */
@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'cps-progress-linear',
  templateUrl: './cps-progress-linear.component.html',
  styleUrls: ['./cps-progress-linear.component.scss']
})
export class CpsProgressLinearComponent implements OnInit {
  /**
   * Width of the progress bar, of type number denoting pixels or string.
   * @group Props
   */
  @Input() width: number | string = '100%';

  /**
   * Height of the progress bar, of type number denoting pixels or string.
   * @group Props
   */
  @Input() height: number | string = '0.5rem';

  /**
   * Color of the progress bar.
   * @group Props
   */
  @Input() color = 'calm';

  /**
   * Background color of the progress bar.
   * @group Props
   */
  @Input() bgColor = 'white';

  /**
   * Option to control the transparency of the progress bar, of type number or string.
   * @group Props
   */
  @Input() opacity: number | string = 1;

  /**
   * Border radius of the progress bar, of type number or string.
   * @group Props
   */
  @Input() radius: number | string = 0;

  ngOnInit(): void {
    this.width = convertSize(this.width);
    this.height = convertSize(this.height);
    this.radius = convertSize(this.radius);

    this.color = getCSSColor(this.color);
    this.bgColor = getCSSColor(this.bgColor);
  }
}
