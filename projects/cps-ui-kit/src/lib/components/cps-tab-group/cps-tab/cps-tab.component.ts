import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  signal,
  TemplateRef,
  ViewChild
} from '@angular/core';

/**
 * CpsTabComponent is a tab within a tab-group.
 * @group Components
 */
@Component({
  imports: [CommonModule],
  selector: 'cps-tab',
  templateUrl: './cps-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CpsTabComponent {
  /**
   * Label of the tab.
   * @group Props
   * @default ''
   */
  readonly label = input('');

  /**
   * Aria label for the tab component, used for accessibility, it takes precedence over label.
   * @group Props
   * @default ''
   */
  readonly ariaLabel = input('');

  /**
   * Icon before the label.
   * @group Props
   * @default ''
   */
  readonly icon = input('');

  /**
   * Determines whether tab is disabled.
   * @group Props
   * @default false
   */
  readonly disabled = input(false);

  /**
   * Determines whether to show the tooltip on tab hover.
   * @group Props
   * @default ''
   */
  readonly tooltipText = input('');

  /**
   * Class for styling the tab tooltip.
   * @group Props
   * @default 'cps-tooltip-content'
   */
  readonly tooltipContentClass = input('cps-tooltip-content');

  /**
   * Max width of the tooltip, of type number denoting pixels or string.
   * @group Props
   * @default 100%
   */
  readonly tooltipMaxWidth = input<number | string>('100%');

  /**
   * Determines whether the tooltip should have persistent info.
   * @group Props
   * @default false
   */
  readonly tooltipPersistent = input(false);

  /**
   * Badge value to show on the tab after the label in a form of a circle.
   * @group Props
   * @default ''
   */
  readonly badgeValue = input('');

  /**
   * Tooltip text to show on badge hover.
   * @group Props
   * @default ''
   */
  readonly badgeTooltip = input('');

  @ViewChild(TemplateRef) content!: TemplateRef<unknown>;

  readonly active = signal(false);

  constructor() {
    effect(() => {
      if (!this.label()?.trim() && !this.ariaLabel()?.trim()) {
        console.error(
          'CpsTabComponent: unlabeled tab component must have an ariaLabel for accessibility.'
        );
      }
    });
  }
}
