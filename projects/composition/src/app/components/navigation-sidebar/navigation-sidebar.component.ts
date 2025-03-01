import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CpsInputComponent } from 'cps-ui-kit';

@Component({
  imports: [RouterModule, CommonModule, FormsModule, CpsInputComponent],
  selector: 'app-navigation-sidebar',
  templateUrl: './navigation-sidebar.component.html',
  styleUrls: ['./navigation-sidebar.component.scss']
})
export class NavigationSidebarComponent implements OnInit {
  @Input() isExpanded = true;

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
      title: 'Button toggle',
      url: '/button-toggle'
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
      title: 'Divider',
      url: '/divider'
    },
    {
      title: 'Expansion panel',
      url: '/expansion-panel'
    },
    {
      title: 'File upload',
      url: '/file-upload'
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
      title: 'Notifications',
      url: '/notification'
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
      url: '/radio-group'
    },
    {
      title: 'Scheduler',
      url: '/scheduler'
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
      title: 'Switch',
      url: '/switch'
    },
    {
      title: 'Table',
      url: '/table'
    },
    {
      title: 'Tabs',
      url: '/tab-group'
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

  filteredComponents: {
    title: string;
    url: string;
  }[] = [];

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
