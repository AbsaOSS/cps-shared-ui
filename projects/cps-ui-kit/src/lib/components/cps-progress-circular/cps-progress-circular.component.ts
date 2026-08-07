import { DOCUMENT } from '@angular/common';
import {
  Component,
  HostAttributeToken,
  Input,
  OnInit,
  OnChanges,
  inject,
  type SimpleChanges
} from '@angular/core';
import { convertSize } from '../../utils/internal/size-utils/size-utils';
import { getCSSColor } from '../../utils/colors-utils/colors-utils';

/**
 * CpsProgressCircularComponent is a process status indicator in a form of a spinner.
 * @group Components
 */
@Component({
  imports: [],
  selector: 'cps-progress-circular',
  templateUrl: './cps-progress-circular.component.html',
  styleUrls: ['./cps-progress-circular.component.scss'],
  host: {
    role: 'progressbar',
    '[attr.aria-label]': 'computedAriaLabel'
  }
})
export class CpsProgressCircularComponent implements OnInit, OnChanges {
  /**
   * Diameter of the progress bar, of type number denoting pixels or string.
   * @group Props
   */
  @Input() diameter: number | string = '2.5rem';

  /**
   * Thickness of the progress bar, of type number denoting pixels or string.
   * @group Props
   */
  @Input() strokeWidth: number | string = '0.25rem';

  /**
   * Color of the progress bar.
   * @group Props
   */
  @Input() color = 'calm';

  /**
   * Accessible label announced by screen readers to describe what is loading.
   * Falls back to "Loading" when empty value is provided.
   * @group Props
   * @default Loading
   */
  @Input() ariaLabel = '';

  private readonly _document = inject(DOCUMENT);
  private readonly _staticAriaLabel = inject(
    new HostAttributeToken('aria-label'),
    { optional: true }
  );

  cvtDiameter = '';
  cvtStrokeWidth = '';
  cvtColor = '';
  computedAriaLabel = '';

  ngOnInit(): void {
    this.cvtDiameter = convertSize(this.diameter);
    this.cvtStrokeWidth = convertSize(this.strokeWidth);
    this.cvtColor = getCSSColor(this.color, this._document);
    this._updateAriaLabel();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.ariaLabel) {
      this._updateAriaLabel();
    }
    if (changes.diameter) {
      this.cvtDiameter = convertSize(this.diameter);
    }
    if (changes.strokeWidth) {
      this.cvtStrokeWidth = convertSize(this.strokeWidth);
    }
    if (changes.color) {
      this.cvtColor = getCSSColor(this.color, this._document);
    }
  }

  private _updateAriaLabel(): void {
    this.computedAriaLabel =
      this.ariaLabel?.trim() || this._staticAriaLabel?.trim() || 'Loading';
  }
}
