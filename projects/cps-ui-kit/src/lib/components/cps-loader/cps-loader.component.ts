import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, Inject, Input, OnInit } from '@angular/core';
import { getCSSColor } from '../../utils/colors-utils';

/**
 * CpsLoaderComponent is a fetch data indicator.
 * @group Components
 */
@Component({
  imports: [CommonModule],
  selector: 'cps-loader',
  templateUrl: './cps-loader.component.html',
  styleUrls: ['./cps-loader.component.scss']
})
export class CpsLoaderComponent implements OnInit {
  /**
   * Option for loader component to take up the whole screen.
   * @group Props
   */
  @Input() fullScreen = false;

  /**
   * Option to control the opacity of the loader component.
   * @group Props
   */
  @Input() opacity: number | string = 0.1;

  /**
   * Color of the label.
   * @group Props
   */
  @Input() labelColor = 'depth';

  /**
   * Determines whether to show 'Loading...' label.
   * @group Props
   */
  @Input() showLabel = true;

  backgroundColor = 'rgba(0, 0, 0, 0.1)';

  // eslint-disable-next-line no-useless-constructor
  constructor(@Inject(DOCUMENT) private document: Document) {}

  ngOnInit(): void {
    this.backgroundColor = `rgba(0, 0, 0, ${this.opacity})`;
    this.labelColor = getCSSColor(this.labelColor, this.document);
  }
}
