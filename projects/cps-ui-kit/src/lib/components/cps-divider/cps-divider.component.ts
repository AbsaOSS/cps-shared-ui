import {
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input
} from '@angular/core';
import { getCSSColor } from '../../utils/colors-utils/colors-utils';
import { convertSize } from '../../utils/internal/size-utils/size-utils';
import { DOCUMENT } from '@angular/common';

/**
 * CpsDividerType is used to define the type of the divider.
 * @group Types
 */
export type CpsDividerType = 'solid' | 'dashed' | 'dotted';

/**
 * CpsDividerComponent is a component that can be used to separate content.
 * @group Components
 */
@Component({
  selector: 'cps-divider',
  host: {
    class: 'cps-divider',
    role: 'separator',
    '[attr.aria-orientation]': 'vertical() ? "vertical" : "horizontal"',
    '[style.border-top]': 'borderTop()',
    '[style.border-right]': 'borderRight()'
  },
  template: '',
  styleUrl: './cps-divider.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class CpsDividerComponent {
  /**
   * Determines whether the divider is vertically aligned.
   * @group Props
   * @default false
   */
  vertical = input(false);

  /**
   * Color of the divider.
   * @group Props
   * @default line-mid
   */
  color = input('line-mid');

  /**
   * Type of the divider.
   * @group Props
   * @default solid
   */
  type = input<CpsDividerType>('solid');

  /**
   * Thickness of the divider, a number denoting pixels or a string.
   * @group Props
   * @default 0.0625rem
   */
  thickness = input<number | string>('0.0625rem');

  private document = inject(DOCUMENT);

  public borderTop = computed(() => {
    return this._constructBorder(!this.vertical());
  });

  public borderRight = computed(() => {
    return this._constructBorder(this.vertical());
  });

  private _constructBorder(isVertical: boolean) {
    return isVertical
      ? `${convertSize(this.thickness())} ${this.type()} ${getCSSColor(this.color(), this.document)}`
      : '';
  }
}
