import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CpsIconComponent, IconType } from '../cps-icon/cps-icon.component';
import { getCSSColor } from '../../utils/colors-utils';
import { convertSize } from '../../utils/internal/size-utils';
import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';

/**
 * CpsExpansionPanelComponent is a component that provides content on expansion.
 * @group Components
 */
@Component({
  standalone: true,
  imports: [CommonModule, CpsIconComponent],
  selector: 'cps-expansion-panel',
  templateUrl: './cps-expansion-panel.component.html',
  styleUrls: ['./cps-expansion-panel.component.scss'],
  animations: [
    trigger('panelContent', [
      state(
        'hidden',
        style({
          height: '0',
          visibility: 'hidden'
        })
      ),
      state(
        'visible',
        style({
          height: '*'
        })
      ),
      transition('visible <=> hidden', [
        animate('0.2s cubic-bezier(0.4, 0, 0.2, 1)')
      ]),
      transition('void => *', animate(0))
    ]),
    trigger('panelHeader', [
      state(
        'hidden',
        style({
          borderBottom: '0'
        })
      ),
      state(
        'visible',
        style({
          borderBottom: '{{borderStyle}}'
        }),
        { params: { borderStyle: '0' } }
      ),
      transition('visible <=> hidden', [
        animate('0.2s cubic-bezier(0.4, 0, 0.2, 1)')
      ]),
      transition('void => *', animate(0))
    ])
  ]
})
export class CpsExpansionPanelComponent implements OnInit {
  /**
   * Title of the expansionPanel element.
   * @group Props
   */
  @Input() headerTitle = '';

  /**
   * Background color of the expansion panel element.
   * @group Props
   */
  @Input() backgroundColor = 'transparent';

  /**
   * Whether to show the chevron icon.
   * @group Props
   */
  @Input() showChevron = true;

  /**
   * Indicates current expansion state.
   * @group Props
   */
  @Input() isExpanded = false;

  /**
   * Whether expansion panel is disabled.
   * @group Props
   */
  @Input() disabled = false;

  /**
   * If true, expansion panel element will have borders.
   * @group Props
   */
  @Input() bordered = true;

  /**
   * The border radius of the component.
   * @group Props
   */
  @Input() borderRadius: number | string = '4px';

  /**
   * Border color of the expansion panel.
   * @group Props
   */
  @Input() borderColor = 'line-dark';

  /**
   * The width of the expansion panel of type number denoting pixels or string.
   * @group Props
   */
  @Input() width: number | string = '100%';

  /**
   * Name of the icon in front of the title.
   * @group Props
   */
  @Input() prefixIcon: IconType = '';

  /**
   * Callback to invoke after a tab gets collapsed.
   * @param {void}
   * @group Emits
   */
  @Output() afterCollapse: EventEmitter<void> = new EventEmitter<void>();

  /**
   * Callback to invoke after a tab gets expanded.
   * @param {void}
   * @group Emits
   */
  @Output() afterExpand: EventEmitter<void> = new EventEmitter<void>();

  ngOnInit(): void {
    this.borderColor = getCSSColor(this.borderColor);
    this.backgroundColor = getCSSColor(this.backgroundColor);
    this.borderRadius = convertSize(this.borderRadius);
    this.width = convertSize(this.width);
  }

  toggleExpansion(): void {
    if (!this.disabled) {
      this.isExpanded = !this.isExpanded;
      if (this.isExpanded) {
        this.afterExpand.emit();
      }
      if (!this.isExpanded) {
        this.afterCollapse.emit();
      }
    }
  }
}
