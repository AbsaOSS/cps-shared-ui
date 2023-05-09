import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { getCSSColor } from '../../utils/colors-utils';

export const iconNames = [
  'absa-logo',
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
  'close-x',
  'close-x-2',
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
  'follow',
  'glossary',
  'graph',
  'grid',
  'grid-view',
  'health',
  'heart',
  'help-circle',
  'home',
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
  'minus',
  'multiple_users',
  'open',
  'path',
  'pdf',
  'plus',
  'projects',
  'question',
  'questions',
  'rectangle-rounded',
  'refresh-browse',
  'remove',
  'right',
  'schema_filter',
  'search',
  'settings',
  'smart',
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
  'xls',
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
  styleUrls: ['./cps-icon.component.scss'],
})
export class CpsIconComponent implements OnChanges {
  @Input() icon: IconType = '';
  @Input() size: iconSizeType = 'small';

  @Input() color = 'currentColor';

  iconColor = 'currentColor';
  url = '../../../../assets/icons/';
  pxSize = '';

  classesList: string[] = ['icon'];

  ngOnChanges(): void {
    this.iconColor = getCSSColor(this.color);
    this.setClasses();
  }

  setClasses(): void {
    if (typeof this.size === 'number') {
      this.pxSize = this.size + 'px';
    } else if (this.size.endsWith('px')) {
      this.pxSize = this.size;
    } else {
      switch (this.size) {
        case 'fill': {
          this.classesList.push('icon--fill');
          break;
        }
        case 'xsmall': {
          this.classesList.push('icon--xsmall');
          break;
        }
        case 'small': {
          this.classesList.push('icon--small');
          break;
        }
        case 'normal': {
          this.classesList.push('icon--normal');
          break;
        }
        case 'large': {
          this.classesList.push('icon--large');
          break;
        }
      }
    }
  }
}
