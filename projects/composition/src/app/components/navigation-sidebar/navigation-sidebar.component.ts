import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterModule, CommonModule],
  selector: 'app-navigation-sidebar',
  templateUrl: './navigation-sidebar.component.html',
  styleUrls: ['./navigation-sidebar.component.scss']
})
export class NavigationSidebarComponent {
  styles = [
    {
      title: 'Color pack',
      url: '/colors'
    }
    // extend this list
  ];

  components = [
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
      title: 'Expansion panel',
      url: '/expansion-panel'
    },
    {
      title: 'Icon',
      url: '/icon'
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
      title: 'Tag',
      url: '/tag'
    },
    {
      title: 'Textarea',
      url: '/textarea'
    }
    // extend this list
  ];
}
