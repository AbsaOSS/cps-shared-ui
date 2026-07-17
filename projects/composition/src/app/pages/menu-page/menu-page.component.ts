import { Component } from '@angular/core';
import { CpsButtonComponent, CpsMenuComponent, CpsMenuItem } from 'cps-ui-kit';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';
import { CodeExampleComponent } from '../../components/code-example/code-example.component';
import ComponetnData from '../../api-data/cps-menu.json';
import { menuExamples } from './menu-page.examples';
@Component({
  selector: 'app-menu-page',
  imports: [
    CpsMenuComponent,
    CpsButtonComponent,
    ComponentDocsViewerComponent,
    CodeExampleComponent
  ],
  templateUrl: './menu-page.component.html',
  styleUrls: ['./menu-page.component.scss'],
  host: { class: 'composition-page' }
})
export class MenuPageComponent {
  readonly examples = menuExamples;
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
      ariaLabel: 'Sixth item is loading',
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
      ariaLabel: 'Sixth item is loading',
      loading: true
    },
    {
      title: 'Go google',
      url: 'https://google.com',
      target: '_blank'
    }
  ];

  componentData = ComponetnData;

  isStandardMenuOpen = false;
  isStandardMenuNoHeaderOpen = false;
  isCompressedMenuOpen = false;
  isCompressedMenuNoIconsOpen = false;
  isArbitraryMenuOpen = false;
  isFocusMenuOpen = false;
  isHoverMenuOpen = false;

  doConsoleLog(event: any) {
    console.log(event.item.title + ' clicked');
  }

  onFocusMenuFocusOut(event: FocusEvent, menu: CpsMenuComponent) {
    if (!menu.container?.contains(event.relatedTarget as Node)) {
      menu.hide();
    }
  }

  onMenuLeave(event: MouseEvent | FocusEvent, menu: CpsMenuComponent) {
    const rel = event.relatedTarget as Node;
    if (
      !menu.container?.contains(rel) &&
      !(menu.target as HTMLElement)?.contains(rel)
    ) {
      menu.hide();
    }
  }
}
