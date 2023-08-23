import {
  Component,
  Input,
  OnInit,
  QueryList,
  ViewChildren
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CpsMenuComponent, CpsMenuItem } from '../cps-menu/cps-menu.component';
import { CpsIconComponent } from '../cps-icon/cps-icon.component';
import { convertSize } from '../../utils/internal/size-utils';
import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';

export type CpsSidebarMenuItem = {
  title: string;
  icon: string;
  url?: string;
  target?: string;
  disabled?: boolean;
  items?: CpsMenuItem[];
};

@Component({
  selector: 'cps-sidebar-menu',
  standalone: true,
  imports: [CommonModule, CpsMenuComponent, CpsIconComponent, RouterModule],
  templateUrl: './cps-sidebar-menu.component.html',
  styleUrls: ['./cps-sidebar-menu.component.scss'],
  animations: [
    trigger('onExpand', [
      state(
        'collapsed',
        style({
          marginTop: '0',
          opacity: '0',
          height: '0',
          visibility: 'hidden'
        })
      ),
      state(
        'expanded',
        style({
          marginTop: '6px',
          opacity: '1'
        })
      ),
      transition('expanded <=> collapsed', [
        animate('0.2s cubic-bezier(0.4, 0, 0.2, 1)')
      ])
    ])
  ]
})
export class CpsSidebarMenuComponent implements OnInit {
  @Input() items: CpsSidebarMenuItem[] = [];
  @Input() isExpanded = true;
  @Input() height = '100%';

  @ViewChildren('popupMenu') allMenus?: QueryList<CpsMenuComponent>;

  // eslint-disable-next-line no-useless-constructor
  constructor(private _router: Router) {}

  ngOnInit(): void {
    this.height = convertSize(this.height);
  }

  toggleMenu(event: any, menu: CpsMenuComponent) {
    const isVisible = menu.isVisible();
    this.allMenus?.forEach((m) => m.hide());
    if (!isVisible) menu.toggle(event, event.currentTarget, 'tr');
  }

  isActive(item: CpsSidebarMenuItem) {
    if (!item.items) return false;
    const urls = item.items.map((i) => i.url);
    return urls.includes(this._router.url);
  }

  toggleSidebar() {
    this.isExpanded = !this.isExpanded;
  }
}
