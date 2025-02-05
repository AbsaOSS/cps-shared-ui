import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, Inject, Input, OnInit } from '@angular/core';
import { convertSize } from '../../utils/internal/size-utils';
import { getCSSColor } from '../../utils/colors-utils';

/**
 * CpsProgressCircularComponent is a process status indicator in a form of a spinner.
 * @group Components
 */
@Component({
  imports: [CommonModule],
  selector: 'cps-progress-circular',
  templateUrl: './cps-progress-circular.component.html',
  styleUrls: ['./cps-progress-circular.component.scss']
})
export class CpsProgressCircularComponent implements OnInit {
  /**
   * Diameter of the progress bar, of type number denoting pixels or string.
   * @group Props
   */
  @Input() diameter: number | string = 40;

  /**
   * Thickness of the progress bar, of type number denoting pixels or string.
   * @group Props
   */
  @Input() strokeWidth: number | string = 4;

  /**
   * Color of the progress bar.
   * @group Props
   */
  @Input() color = 'calm';

  // eslint-disable-next-line no-useless-constructor
  constructor(@Inject(DOCUMENT) private document: Document) {}

  ngOnInit(): void {
    this.diameter = convertSize(this.diameter);
    this.strokeWidth = convertSize(this.strokeWidth);

    this.color = getCSSColor(this.color, this.document);
  }
}
