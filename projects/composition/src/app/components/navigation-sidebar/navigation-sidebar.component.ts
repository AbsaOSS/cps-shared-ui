import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CpsInputComponent } from 'cps-ui-kit';

@Component({
  standalone: true,
  imports: [RouterModule, CommonModule, CpsInputComponent, FormsModule],
  selector: 'app-navigation-sidebar',
  templateUrl: './navigation-sidebar.component.html',
  styleUrls: ['./navigation-sidebar.component.scss']
})
export class NavigationSidebarComponent implements OnInit {
  styles = [
    {
      title: 'Color pack',
      url: '/colors'
    }
    // extend this list
  ];

  private _components = [
    {
      title: 'Autocomplete',
      url: '/autocomplete'
    },
    {
      title: 'Button',
      url: '/button'
    },
    {
      title: 'Button toggles',
      url: '/button-toggles'
    },
    {
      title: 'Checkbox',
      url: '/checkbox'
    },
    {
      title: 'Chip',
      url: '/chip'
    },
    {
      title: 'Datepicker',
      url: '/datepicker'
    },
    {
      title: 'Dialog',
      url: '/dialog'
    },
    {
      title: 'Expansion panel',
      url: '/expansion-panel'
    },
    {
      title: 'Icon',
      url: '/icon'
    },
    {
      title: 'Info circle',
      url: '/info-circle'
    },
    {
      title: 'Input',
      url: '/input'
    },
    {
      title: 'Loader',
      url: '/loader'
    },
    {
      title: 'Menu',
      url: '/menu'
    },
    {
      title: 'Paginator',
      url: '/paginator'
    },
    {
      title: 'Progress circular',
      url: '/progress-circular'
    },
    {
      title: 'Progress linear',
      url: '/progress-linear'
    },
    {
      title: 'Radio',
      url: '/radio'
    },
    {
      title: 'Select',
      url: '/select'
    },
    {
      title: 'Sidebar menu',
      url: '/sidebar-menu'
    },
    {
      title: 'Table',
      url: '/table'
    },
    {
      title: 'Tabs',
      url: '/tabs'
    },
    {
      title: 'Tag',
      url: '/tag'
    },
    {
      title: 'Textarea',
      url: '/textarea'
    },
    {
      title: 'Timepicker',
      url: '/timepicker'
    },
    {
      title: 'Notifications',
      url: '/notifications'
    },
    {
      title: 'Tooltip directive',
      url: '/tooltip'
    },
    {
      title: 'Tree autocomplete',
      url: '/tree-autocomplete'
    },
    {
      title: 'Tree select',
      url: '/tree-select'
    },
    {
      title: 'Tree table',
      url: '/tree-table'
    }
    // extend this list
  ];

  filteredComponents = [] as {
    title: string;
    url: string;
  }[];

  searchVal = '';

  ngOnInit(): void {
    this.filteredComponents = [...this._components];
  }

  onSearchChanged(value: string) {
    this._filterComponentsList(value);
  }

  private _filterComponentsList(searchStr: string) {
    if (!searchStr) {
      this.filteredComponents = [...this._components];
      return;
    }
    searchStr = searchStr.toLowerCase();

    this.filteredComponents = this._components.filter((c) =>
      c.title.toLocaleLowerCase().includes(searchStr)
    );
  }

  onComponentSelect() {
    this.searchVal = '';
    this.filteredComponents = [...this._components];
  }
}
