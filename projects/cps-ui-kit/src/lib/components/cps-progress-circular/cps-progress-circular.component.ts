import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  Component,
  HostAttributeToken,
  Input,
  OnInit,
  OnChanges,
  ElementRef,
  Renderer2,
  inject,
  type SimpleChanges
} from '@angular/core';
import { convertSize } from '../../utils/internal/size-utils';
import { getCSSColor } from '../../utils/colors-utils';

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
    role: 'progressbar'
  }
})
export class CpsProgressCircularComponent
  implements OnInit, OnChanges, AfterViewInit
{
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

  private readonly _elementRef = inject(ElementRef);
  private readonly _document = inject(DOCUMENT);
  private readonly _renderer = inject(Renderer2);
  private readonly _staticAriaLabel = inject(
    new HostAttributeToken('aria-label'),
    { optional: true }
  );

  cvtDiameter = '';
  cvtStrokeWidth = '';
  cvtColor = '';

  ngOnInit(): void {
    this.cvtDiameter = convertSize(this.diameter);
    this.cvtStrokeWidth = convertSize(this.strokeWidth);
    this.cvtColor = getCSSColor(this.color, this._document);
    this._applyAriaLabel();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.ariaLabel) {
      this._applyAriaLabel();
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

  ngAfterViewInit(): void {
    if (!this._elementRef.nativeElement.getAttribute('aria-label')) {
      this._renderer.setAttribute(
        this._elementRef.nativeElement,
        'aria-label',
        'Loading'
      );
    }
  }

  private _applyAriaLabel(): void {
    const label = this.ariaLabel || this._staticAriaLabel;
    if (label) {
      this._renderer.setAttribute(
        this._elementRef.nativeElement,
        'aria-label',
        label
      );
    }
  }
}
