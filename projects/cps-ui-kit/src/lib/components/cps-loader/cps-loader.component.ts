import { CommonModule, DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  Component,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  type SimpleChanges
} from '@angular/core';
import { getCSSColor } from '../../utils/colors-utils';
import { logMissingAriaLabelError } from '../../utils/internal/accessibility-utils';
import { CPS_LIVE_ANNOUNCER_SERVICE } from '../../services/cps-live-announcer/cps-live-announcer.service';

/**
 * CpsLoaderComponent is a fetch data indicator.
 * @group Components
 */
@Component({
  imports: [CommonModule],
  selector: 'cps-loader',
  templateUrl: './cps-loader.component.html',
  styleUrls: ['./cps-loader.component.scss'],
  host: { 'aria-busy': 'true' }
})
export class CpsLoaderComponent
  implements OnInit, OnChanges, AfterViewInit, OnDestroy
{
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
  @Input() labelColor = 'var(--cps-accent-primary)';

  /**
   * Determines whether to show 'Loading...' label.
   * @group Props
   */
  @Input() showLabel = true;

  /**
   * Text shown visually when showLabel is true.
   * @group Props
   */
  @Input() label = 'Loading...';

  /**
   * Text announced by screen readers. Used when showLabel is false or label
   * is empty.
   * @group Props
   */
  @Input() ariaLabel = 'Loading';

  /**
   * Text announced by screen readers when the loader is destroyed.
   * @group Props
   */
  @Input() doneAriaLabel = 'Loading complete';

  backgroundColor = 'var(--cps-surface-overlay)';
  cvtLabelColor = '';

  private _document = inject(DOCUMENT);
  private _announcer = inject(CPS_LIVE_ANNOUNCER_SERVICE);

  ngOnInit(): void {
    this.backgroundColor = `rgba(0, 0, 0, ${this.opacity})`;
    this.cvtLabelColor = getCSSColor(this.labelColor, this._document);
    logMissingAriaLabelError('CpsLoaderComponent', this.label, this.ariaLabel);
  }

  ngAfterViewInit(): void {
    this._announcer?.announce(
      this.showLabel && this.label.trim() ? this.label : this.ariaLabel
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.opacity) {
      this.backgroundColor = `rgba(0, 0, 0, ${this.opacity})`;
    }
    if (changes.labelColor) {
      this.cvtLabelColor = getCSSColor(this.labelColor, this._document);
    }
    logMissingAriaLabelError('CpsLoaderComponent', this.label, this.ariaLabel);
  }

  ngOnDestroy(): void {
    if (this.doneAriaLabel.trim()) {
      this._announcer?.announce(this.doneAriaLabel);
    }
  }
}
