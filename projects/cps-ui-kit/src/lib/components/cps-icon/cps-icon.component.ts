import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { convertSize } from '../../utils/internal/size-utils';
import { getCSSColor } from '../../utils/colors-utils';

export const iconNames = [
  'access',
  'access-denied',
  'access-menu',
  'access-unlock',
  'add',
  'add-domain',
  'avatar',
  'avatar-top-menu',
  'bell',
  'book',
  'bookmark',
  'browse',
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
  'community',
  'construction',
  'controls',
  'csv',
  'cub',
  'database',
  'datepicker',
  'delete',
  'dislike',
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
  'follow',
  'glossary',
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
  'kris',
  'last-seen-product',
  'like',
  'line-vertical',
  'lock',
  'logout',
  'menu-expand',
  'menu-shrink',
  'minus',
  'move-grabber',
  'open',
  'path',
  'pdf',
  'plus',
  'projects',
  'question',
  'questions',
  'rectangle-rounded',
  'refresh',
  'remove',
  'right',
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

export type IconType = (typeof iconNames)[number];

export type iconSizeType =
  | number
  | string
  | 'fill'
  | 'xsmall'
  | 'small'
  | 'normal'
  | 'large';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'cps-icon',
  templateUrl: './cps-icon.component.html',
  styleUrls: ['./cps-icon.component.scss']
})
export class CpsIconComponent implements OnChanges {
  /**
   * Name of the icon.
   * @group Props
   */
  @Input() icon: IconType = '';

  /**
   * Size of the icon.
   * @group Props
   */
  @Input() size: iconSizeType = 'small';

  /**
   * Color of the icon.
   * @group Props
   */
  @Input() color = 'currentColor';

  iconColor = 'currentColor';
  url = '../../../../assets/';
  cvtSize = '';

  classesList: string[] = ['cps-icon'];

  ngOnChanges(): void {
    this.iconColor = getCSSColor(this.color);
    this.setClasses();
  }

  setClasses(): void {
    switch (this.size) {
      case 'fill': {
        this.classesList.push('cps-icon--fill');
        break;
      }
      case 'xsmall': {
        this.classesList.push('cps-icon--xsmall');
        break;
      }
      case 'small': {
        this.classesList.push('cps-icon--small');
        break;
      }
      case 'normal': {
        this.classesList.push('cps-icon--normal');
        break;
      }
      case 'large': {
        this.classesList.push('cps-icon--large');
        break;
      }
      default:
        this.cvtSize = convertSize(this.size);
        break;
    }
  }
}
