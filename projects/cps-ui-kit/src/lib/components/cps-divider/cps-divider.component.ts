import { Component, ViewEncapsulation, computed, input } from '@angular/core';
import { getCSSColor } from '../../utils/colors-utils';
import { convertSize } from '../../utils/internal/size-utils';

/**
 * CpsDividerComponent is a component that can be used to separate content.
 * @group Components
 */
@Component({
  selector: 'cps-divider',
  host: {
    class: 'cps-divider',
    '[class.cps-divider-vertical]': 'vertical()',
    '[class.cps-divider-horizontal]': '!vertical()',
    '[style.border-color]': '_dividerColor()',
    '[style.border-width]': '_dividerThickness()'
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
   */
  vertical = input(false);

  /**
   * Color of the divider.
   * @group Props
   */
  color = input('line-mid');

  /**
   * Thickness of the divider, a number denoting pixels or a string.
   * @group Props
   */
  thickness = input<number | string>('1px');

  private _dividerColor = computed(() => {
    return getCSSColor(this.color());
  });

  private _dividerThickness = computed(() => {
    return convertSize(this.thickness());
  });
}
