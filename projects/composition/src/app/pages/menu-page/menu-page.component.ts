import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CpsButtonComponent, CpsMenuComponent, CpsMenuItem } from 'cps-ui-kit';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';

import ComponetnData from '../../api-data/cps-menu.json';
@Component({
  selector: 'app-menu-page',
  imports: [
    CommonModule,
    CpsMenuComponent,
    CpsButtonComponent,
    ComponentDocsViewerComponent
  ],
  templateUrl: './menu-page.component.html',
  styleUrls: ['./menu-page.component.scss'],
  host: { class: 'composition-page' }
})
export class MenuPageComponent {
  items: CpsMenuItem[] = [
    {
      title: 'First item',
      desc: 'First item description',
      icon: 'remove',
      action: (event: any) => {
        this.doConsoleLog(event);
      }
    },
    {
      title: 'Second item',
      desc: 'Second item is disabled',
      icon: 'bell',
      disabled: true,
      action: (event: any) => {
        this.doConsoleLog(event);
      }
    },
    {
      title: 'Third item',
      icon: 'browse',
      action: (event: any) => {
        this.doConsoleLog(event);
      }
    },
    {
      title: 'Fourth item',
      desc: 'Fourth item description',
      action: (event: any) => {
        this.doConsoleLog(event);
      }
    },
    {
      title: 'Fifth item',
      action: (event: any) => {
        this.doConsoleLog(event);
      }
    },
    {
      loading: true
    },
    {
      title: 'Go google',
      url: 'https://google.com',
      target: '_blank'
    }
  ];

  itemsWithoutIcons: CpsMenuItem[] = [
    {
      title: 'First item',
      desc: 'First item description',
      action: (event: any) => {
        this.doConsoleLog(event);
      }
    },
    {
      title: 'Second item',
      desc: 'Second item is disabled',
      disabled: true,
      action: (event: any) => {
        this.doConsoleLog(event);
      }
    },
    {
      title: 'Third item',
      action: (event: any) => {
        this.doConsoleLog(event);
      }
    },
    {
      title: 'Fourth item',
      desc: 'Fourth item description',
      action: (event: any) => {
        this.doConsoleLog(event);
      }
    },
    {
      title: 'Fifth item',
      action: (event: any) => {
        this.doConsoleLog(event);
      }
    },
    {
      loading: true
    },
    {
      title: 'Go google',
      url: 'https://google.com',
      target: '_blank'
    }
  ];

  componentData = ComponetnData;

  doConsoleLog(event: any) {
    console.log(event.item.title + ' clicked');
  }
}
