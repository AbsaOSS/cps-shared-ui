import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CpsMenuComponent, CpsMenuItem } from 'cps-ui-kit';

@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [CommonModule, CpsMenuComponent],
  templateUrl: './menu-page.component.html',
  styleUrls: ['./menu-page.component.scss'],
  host: { class: 'composition-page' }
})
export class MenuPageComponent {
  items = [
    {
      title: 'First item',
      desc: 'First item description',
      icon: 'avatar',
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
    }
  ] as CpsMenuItem[];

  doConsoleLog(event: any) {
    console.log(event.item.title + ' clicked');
  }
}
