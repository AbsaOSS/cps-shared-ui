import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterModule, CommonModule],
  selector: 'app-navigation-sidebar',
  templateUrl: './navigation-sidebar.component.html',
  styleUrls: ['./navigation-sidebar.component.scss'],
})
export class NavigationSidebarComponent {
  styles = [
    {
      title: 'Color pack',
      url: '/colors',
    },
    // extend this list
  ];
  components = [
    {
      title: 'Icon',
      url: '/icon',
    },
    {
      title: 'Input',
      url: '/input',
    },
    {
      title: 'Button',
      url: '/button',
    },
    {
      title: 'Checkbox',
      url: '/checkbox',
    },
    {
      title: 'Radio',
      url: '/radio',
    },
    {
      title: 'Tag',
      url: '/tag',
    },
    // extend this list
  ];
}
