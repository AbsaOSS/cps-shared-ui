import { CommonModule, DOCUMENT } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostBinding,
  Inject,
  Input,
  OnChanges,
  Output
} from '@angular/core';
import { getCSSColor } from '../../utils/colors-utils';
import { CpsIconComponent, IconType } from '../cps-icon/cps-icon.component';
import { CpsProgressCircularComponent } from '../cps-progress-circular/cps-progress-circular.component';
import { convertSize, parseSize } from '../../utils/internal/size-utils';

/**
 * CpsButtonComponent is a button element.
 * @group Components
 */
@Component({
  imports: [CommonModule, CpsIconComponent, CpsProgressCircularComponent],
  selector: 'cps-button',
  templateUrl: './cps-button.component.html',
  styleUrls: ['./cps-button.component.scss']
})
export class CpsButtonComponent implements OnChanges {
  /**
   * Color of the button.
   * @group Props
   */
  @Input() color = 'calm';

  /**
   * Color of content on the button. Works only with 'solid' type.
   * @group Props
   */
  @Input() contentColor = 'white';

  /**
   * Border radius of the button, of type number denoting pixels or string.
   * @group Props
   */
  @Input() borderRadius: number | string = 4;

  /**
   * Type of the button in terms of appearance, it can be 'solid' or 'outlined' or 'borderless'.
   * @group Props
   */
  @Input() type: 'solid' | 'outlined' | 'borderless' = 'solid';

  /**
   * Label or text on the button.
   * @group Props
   */
  @Input() label = '';

  /**
   * Aria label for the button, used for accessibility, it takes precedence over label.
   * @group Props
   */
  @Input() ariaLabel = '';

  /**
   * Name of the icon on the button.
   * @group Props
   */
  @Input() icon: IconType = '';

  /**
   * Position of the icon on the button, it can be 'before' or 'after'.
   * @group Props
   */
  @Input() iconPosition: 'before' | 'after' = 'before';

  /**
   * Size on the button, it can be 'xsmall', 'small', 'normal' or 'large'.
   * @group Props
   */
  @Input() size: 'xsmall' | 'small' | 'normal' | 'large' = 'normal';

  /**
   * Width on the button, of type number denoting pixels or string.
   * @group Props
   */
  @Input() width: number | string = 0;

  /**
   * Height on the button, of type number denoting pixels or string.
   * @group Props
   */
  @Input() height: number | string = 0;

  /**
   * Determines whether the button is disabled.
   * @group Props
   */
  @Input() disabled = false;

  /**
   * When enabled, a cps-progress-circular bar is displayed.
   * @group Props
   */
  @Input() loading = false;

  /**
   * Callback to execute when button is clicked.
   * @param {any} any - button clicked.
   * @group Emits
   */
  @Output() clicked = new EventEmitter();

  buttonColor = '';
  textColor = '';

  @HostBinding('style.width')
  cvtWidth = '';

  cvtHeight = '';
  cvtFontSize = '';
  cvtIconSize = '';

  classesList: string[] = [];
  enterActive = false;

  // eslint-disable-next-line no-useless-constructor
  constructor(@Inject(DOCUMENT) private document: Document) {}

  ngOnChanges(): void {
    this.buttonColor = getCSSColor(this.color, this.document);
    this.borderRadius = convertSize(this.borderRadius);
    this.textColor =
      this.type === 'solid'
        ? getCSSColor(this.contentColor, this.document)
        : this.buttonColor;
    if (this.disabled || this.loading) {
      this.enterActive = false;
    }
    if (!this.label && !this.ariaLabel) {
      console.error(
        'CpsButtonComponent: icon-only or unlabeled button must have an ariaLabel for accessibility.'
      );
    }
    this.setClasses();
  }

  setClasses() {
    this.classesList = ['cps-button'];

    if (this.width) {
      this.cvtWidth = convertSize(this.width);
    }

    if (this.height) {
      this.cvtHeight = convertSize(this.height);
      if (this.cvtHeight) {
        const parsedHeight = parseSize(this.cvtHeight);
        const unit = parsedHeight.unit;
        const size = parsedHeight.value * 0.4;
        const isPx = unit === 'px';

        this.cvtFontSize = `${isPx ? Math.floor(size) : size}${unit}`;
        this.cvtIconSize = `${isPx ? Math.ceil(size) : size}${unit}`;
      }
    } else {
      switch (this.size) {
        case 'normal': {
          this.classesList.push('cps-button--normal');
          break;
        }
        case 'large': {
          this.classesList.push('cps-button--large');
          break;
        }
        case 'small': {
          this.classesList.push('cps-button--small');
          break;
        }
        case 'xsmall': {
          this.classesList.push('cps-button--xsmall');
          break;
        }
      }
    }

    switch (this.type) {
      case 'solid': {
        this.classesList.push('cps-button--solid');
        break;
      }
      case 'outlined': {
        this.classesList.push('cps-button--outlined');
        break;
      }
      case 'borderless': {
        this.classesList.push('cps-button--borderless');
        break;
      }
    }

    if (this.icon && this.label) {
      switch (this.iconPosition) {
        case 'before': {
          this.classesList.push('cps-button--icon-before');
          break;
        }
        case 'after': {
          this.classesList.push('cps-button--icon-after');
          break;
        }
      }
    }
  }

  onClick(event: Event) {
    if (this.disabled || this.loading) return;
    this.clicked.emit(event);
  }

  onEnterKeydown() {
    if (this.disabled || this.loading) return;
    this.enterActive = true;
  }

  onEnterKeyup() {
    this.enterActive = false;
  }

  onBlur() {
    this.enterActive = false;
  }
}
