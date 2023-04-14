import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CpsIconComponent, CpsInputComponent } from 'cps-ui-kit';

const iconsList = [
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
  'heart',
  'help-circle',
  'home',
  'insight',
  'issues',
  'jpeg',
  'kris',
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
  'required',
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

@Component({
  standalone: true,
  imports: [CpsIconComponent, CpsInputComponent, CommonModule, FormsModule],
  selector: 'app-icons-page',
  templateUrl: './icons-page.component.html',
  styleUrls: ['./icons-page.component.scss'],
  host: { class: 'composition-page' },
})
export class IconsPageComponent implements OnInit {
  filteredIconsList = [] as string[];

  ngOnInit() {
    this.filteredIconsList = iconsList;
  }

  onSearchChanged(value: string) {
    this._filterIcons(value);
  }

  private _filterIcons(name: string) {
    name = name.toLowerCase();
    this.filteredIconsList = iconsList.filter((n) =>
      n.toLowerCase().includes(name)
    );
  }

  onCopyIconName(name: string) {
    navigator.clipboard.writeText(name).then(
      () => {
        console.log('Content copied to clipboard');
      },
      () => {
        console.error('Failed to copy icon name to clickboard');
      }
    );
  }
}
