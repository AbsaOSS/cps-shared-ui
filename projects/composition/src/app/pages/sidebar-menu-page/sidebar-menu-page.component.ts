import { Component } from '@angular/core';
import {
  CpsIconComponent,
  CpsSidebarMenuComponent,
  CpsSidebarMenuItem
} from 'cps-ui-kit';

import ComponentData from '../../api-data/cps-sidebar-menu.json';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';
import { CodeExampleComponent } from '../../components/code-example/code-example.component';
import { sidebarMenuExamples } from './sidebar-menu-page.examples';

@Component({
  selector: 'app-sidebar-menu-page',
  imports: [
    CpsSidebarMenuComponent,
    CpsIconComponent,
    ComponentDocsViewerComponent,
    CodeExampleComponent
  ],
  templateUrl: './sidebar-menu-page.component.html',
  styleUrls: ['./sidebar-menu-page.component.scss'],
  host: { class: 'composition-page' }
})
export class SidebarMenuPageComponent {
  readonly examples = sidebarMenuExamples;
  items: CpsSidebarMenuItem[] = [
    {
      title: 'Dashboard',
      icon: 'grid',
      url: '/'
    },
    {
      title: 'Favourites',
      icon: 'star',
      url: '/sidebar-menu/examples'
    },
    {
      title: 'Categories disabled',
      icon: 'book',
      url: '/',
      disabled: true
    },
    {
      title: 'Access menu',
      icon: 'access-lock',
      items: [
        { title: 'Requests', desc: 'Apply for access', url: '/' },
        {
          title: 'Approval',
          desc: 'Approve or reject access requests',
          url: '/'
        }
      ]
    },
    {
      title: 'Community menu',
      icon: 'users',
      items: [{ title: 'Questions', desc: 'See all questions', url: '/' }]
    },
    {
      title: 'Bookmarks menu disabled',
      icon: 'bookmark',
      disabled: true,
      items: [
        {
          title: 'Disabled cat',
          desc: 'This is not visible',
          url: '/'
        }
      ]
    }
  ];

  componentData = ComponentData;
}
