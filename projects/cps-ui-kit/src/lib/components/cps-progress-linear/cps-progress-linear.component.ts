import { DOCUMENT } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { getCSSColor } from '../../utils/colors-utils';
import { convertSize } from '../../utils/internal/size-utils';

/**
 * CpsProgressLinearComponent is a process status indicator of a rectangular form.
 * @group Components
 */
@Component({
  selector: 'cps-progress-linear',
  templateUrl: './cps-progress-linear.component.html',
  styleUrls: ['./cps-progress-linear.component.scss'],
  host: {
    role: 'progressbar',
    '[attr.aria-label]': 'ariaLabel()'
  }
})
export class CpsProgressLinearComponent {
  /**
   * Width of the progress bar, of type number denoting pixels or string.
   * @group Props
   * @default 100%
   */
  width = input<number | string>('100%');

  /**
   * Height of the progress bar, of type number denoting pixels or string.
   * @group Props
   * @default 0.5rem
   */
  height = input<number | string>('0.5rem');

  /**
   * Color of the progress bar.
   * @group Props
   * @default var(--cps-accent-primary)
   */
  color = input('var(--cps-accent-primary)');

  /**
   * Background color of the progress bar.
   * @group Props
   * @default white
   */
  bgColor = input('white');

  /**
   * Option to control the opacity of the progress bar.
   * @group Props
   * @default 1
   */
  opacity = input<number | string>(1);

  /**
   * Border radius of the progress bar, of type number denoting pixels or string.
   * @group Props
   * @default 0
   */
  radius = input<number | string>(0);

  /**
   * Accessible label announced by screen readers to describe what is loading.
   * @group Props
   * @default Loading
   */
  ariaLabel = input('Loading');

  private readonly _document = inject(DOCUMENT);

  cvtWidth = computed(() => convertSize(this.width()));
  cvtHeight = computed(() => convertSize(this.height()));
  cvtRadius = computed(() => convertSize(this.radius()));
  cssColor = computed(() => getCSSColor(this.color(), this._document));
  cssBgColor = computed(() => getCSSColor(this.bgColor(), this._document));
}
