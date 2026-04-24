import {
  Component,
  Inject,
  ViewEncapsulation,
  computed,
  input
} from '@angular/core';
import { getCSSColor } from '../../utils/colors-utils';
import { convertSize } from '../../utils/internal/size-utils';
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
    '[style.border-top]': 'borderTop()',
    '[style.border-right]': 'borderRight()'
  },
  standalone: true,
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
   * @default 1px
   */
  thickness = input<number | string>('1px');

  // eslint-disable-next-line no-useless-constructor
  constructor(@Inject(DOCUMENT) private document: Document) {}

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
