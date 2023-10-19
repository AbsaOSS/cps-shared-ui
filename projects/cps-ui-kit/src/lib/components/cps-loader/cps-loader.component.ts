import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { getCSSColor } from '../../utils/colors-utils';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'cps-loader',
  templateUrl: './cps-loader.component.html',
  styleUrls: ['./cps-loader.component.scss']
})
export class CpsLoaderComponent implements OnInit {
  /**
   * Option for loader component to take up the whole screan.
   * @group Props
   */
  @Input() fullScreen = false;
  /**
   * Option to control the transparency of the loader component, of type number or string.
   * @group Props
   */
  @Input() opacity: number | string = 0.1;
  /**
   * Color of the lable.
   * @group Props
   */
  @Input() labelColor = 'depth';
  /**
   * Option to show lable.
   * @group Props
   */
  @Input() showLabel = true;

  backgroundColor = 'rgba(0, 0, 0, 0.1)';

  ngOnInit(): void {
    this.backgroundColor = `rgba(0, 0, 0, ${this.opacity})`;
    this.labelColor = getCSSColor(this.labelColor);
  }
}
