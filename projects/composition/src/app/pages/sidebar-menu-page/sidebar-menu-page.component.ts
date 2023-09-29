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
      url: '/'
    },
    {
      title: 'Favourites',
      icon: 'star',
      url: '/sidebar-menu'
    },
    {
      title: 'Categories disabled',
      icon: 'book',
      url: '/ghi',
      disabled: true
    },
    {
      title: 'Access menu',
      icon: 'access-menu',
      items: [
        { title: 'Requests', desc: 'Apply for access', url: '/jkl' },
        {
          title: 'Approval',
          desc: 'Approve or reject access requests',
          url: '/mno'
        }
      ]
    },
    {
      title: 'Community menu',
      icon: 'users',
      items: [{ title: 'Questions', desc: 'See all questions', url: '/pqr' }]
    },
    {
      title: 'Bookmarks menu disabled',
      icon: 'bookmark',
      disabled: true,
      items: [
        {
          title: 'Disabled cat',
          desc: 'This is not visible',
          url: '/stu'
        }
      ]
    }
  ];
}
