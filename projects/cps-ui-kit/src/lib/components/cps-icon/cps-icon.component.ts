import { CommonModule, DOCUMENT } from '@angular/common';
import {
  Component,
  ElementRef,
  inject,
  InjectionToken,
  Input,
  OnChanges,
  OnInit,
  type SimpleChanges
} from '@angular/core';
import { getCSSColor } from '../../utils/colors-utils';
import { convertSize } from '../../utils/internal/size-utils';

/**
 * Injection token that is used to provide the path to the icons.
 */
export const ICONS_PATH = new InjectionToken<string>(
  'Icons path for CpsIconComponent'
);

export const iconNames = [
  'access',
  'access-denied',
  'access-lock',
  'access-unlock',
  'add',
  'add-domain',
  'angle-left',
  'angle-right',
  'attribute',
  'avatar',
  'avatar-top-menu',
  'bell',
  'book',
  'bookmark',
  'browse',
  'burger',
  'burger-arrow',
  'caret-down',
  'change',
  'checked',
  'chevron-down',
  'chevron-down-2',
  'circle',
  'cleansing',
  'close-x',
  'close-x-2',
  'columns',
  'construction',
  'controls',
  'copy',
  'csv',
  'cube',
  'database',
  'datafeed',
  'datepicker',
  'delete',
  'dislike',
  'domain',
  'dots',
  'download',
  'dq',
  'dropdown-menu',
  'edit',
  'expand',
  'export',
  'eye',
  'filter',
  'filter_2',
  'filter-funnel',
  'filter-funnel-filled',
  'follow',
  'graph',
  'grid',
  'grid-view',
  'health',
  'heart',
  'help-circle',
  'home',
  'info-circle',
  'insight',
  'issues',
  'jpeg',
  'json',
  'kafka',
  'kris',
  'last-seen-product',
  'left',
  'like',
  'line-vertical',
  'lock',
  'logout',
  'maximize',
  'measurement',
  'menu-expand',
  'menu-shrink',
  'minimize',
  'minus',
  'moon',
  'move-grabber',
  'open',
  'ownership',
  'path',
  'pdf',
  'pending',
  'plus',
  'projects',
  'question',
  'questions',
  'rectangle-rounded',
  'refresh',
  'remove',
  'right',
  'save',
  'schema',
  'schema_filter',
  'search',
  'settings',
  'smart',
  'sort-icon-asc',
  'sort-icon-desc',
  'star',
  'stepper-completed',
  'success',
  'suggestion',
  'sun',
  'survivorship',
  'table-row-error',
  'table-row-success',
  'table-row-warning',
  'toast-error',
  'toast-info',
  'toast-success',
  'toast-warning',
  'tools',
  'user',
  'users',
  'vector',
  'vector-down',
  'vector-right',
  'vector-up',
  'wallet',
  'warning',
  'widget-button-icon',
  'xls'
];

/**
 * IconType is used to define the type of the icon.
 * @group Types
 */
export type IconType = (typeof iconNames)[number];

/**
 * iconSizeType is used to define the size of the icon.
 * @group Types
 */
export type iconSizeType =
  | number
  | string
  | 'fill'
  | 'xsmall'
  | 'small'
  | 'normal'
  | 'large';

/**
 * CpsIconComponent is a component that is used for icons.
 * @group Components
 */
@Component({
  imports: [CommonModule],
  selector: 'cps-icon',
  templateUrl: './cps-icon.component.html',
  styleUrls: ['./cps-icon.component.scss'],
  host: {
    '[attr.role]': 'hasAriaLabel() ? "img" : null',
    '[attr.aria-hidden]': 'hasAriaLabel() ? null : "true"'
  }
})
export class CpsIconComponent implements OnInit, OnChanges {
  /**
   * Name of the icon.
   * @group Props
   */
  @Input() icon: IconType = '';

  /**
   * Size of the icon, it can be of type number denoting pixels, string or 'fill', 'xsmall', 'small', 'normal' or 'large'.
   * @group Props
   */
  @Input() size: iconSizeType = 'small';

  /**
   * Color of the icon.
   * @group Props
   */
  @Input() color = 'currentColor';

  /**
   * Accessible label for the icon.
   * When provided the icon is treated as informative (role="img", aria-hidden removed).
   * When omitted the icon is treated as decorative (aria-hidden="true", role removed).
   * @group Props
   * @default ''
   */
  @Input()
  set ariaLabel(v: string) {
    this._ariaLabel = v;
    this._syncAriaLabel();
  }

  get ariaLabel(): string {
    return this._ariaLabel;
  }

  private _ariaLabel = '';

  hasAriaLabel(): boolean {
    return !!(
      this._ariaLabel ||
      this._elementRef.nativeElement.getAttribute('aria-label')
    );
  }

  iconColor = 'currentColor';
  url = inject(ICONS_PATH, { optional: true }) ?? 'assets/';
  cvtSize = '';

  classesList: string[] = ['cps-icon'];

  private _document = inject(DOCUMENT);
  private _elementRef = inject(ElementRef);

  ngOnInit(): void {
    this.iconColor = getCSSColor(this.color, this._document);
    this.setClasses();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.color) {
      this.iconColor = getCSSColor(this.color, this._document);
    }
    if (changes.size) {
      this.setClasses();
    }
  }

  private _syncAriaLabel(): void {
    const el: HTMLElement = this._elementRef.nativeElement;
    if (this._ariaLabel) {
      el.setAttribute('aria-label', this._ariaLabel);
    } else {
      el.removeAttribute('aria-label');
    }
  }

  setClasses(): void {
    const classes = ['cps-icon'];
    let size = '';
    switch (this.size) {
      case 'fill': {
        classes.push('cps-icon--fill');
        break;
      }
      case 'xsmall': {
        classes.push('cps-icon--xsmall');
        break;
      }
      case 'small': {
        classes.push('cps-icon--small');
        break;
      }
      case 'normal': {
        classes.push('cps-icon--normal');
        break;
      }
      case 'large': {
        classes.push('cps-icon--large');
        break;
      }
      default:
        size = convertSize(this.size);
        break;
    }
    this.cvtSize = size;
    this.classesList = classes;
  }
}
