import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CpsSidebarMenuComponent, CpsSidebarMenuItem } from 'cps-ui-kit';

@Component({
  selector: 'app-sidebar-menu-page',
  standalone: true,
  imports: [CommonModule, CpsSidebarMenuComponent],
  templateUrl: './sidebar-menu-page.component.html',
  styleUrls: ['./sidebar-menu-page.component.scss']
})
export class SidebarMenuPageComponent {
  items: CpsSidebarMenuItem[] = [
    {
      title: 'Dashboard',
      icon: 'grid',
      url: '/sidebar-menu'
    },
    {
      title: 'Favourites',
      icon: 'star',
      url: '/def',
      disabled: true
    },
    {
      title: 'Domains',
      icon: 'book',
      url: '/ghi'
    },
    {
      title: 'Domain Access',
      icon: 'access-menu',
      items: [
        { title: 'Requests', desc: 'Apply for access to domains', url: '/jkl' },
        {
          title: 'Approval',
          desc: 'Approve or reject domain requests',
          url: '/mno'
        }
      ]
    },
    {
      title: 'Community',
      icon: 'multiple_users',
      items: [
        { title: 'Questions', desc: 'Questions about all domains', url: '/pqr' }
      ]
    },
    {
      title: 'Disabled',
      icon: 'multiple_users',
      disabled: true,
      items: [
        {
          title: 'Disabled cat',
          desc: 'Questions about all domains',
          url: '/stu'
        }
      ]
    }
  ];
}
