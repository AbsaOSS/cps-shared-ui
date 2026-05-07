import {
  Component,
  Input,
  QueryList,
  ViewChildren,
  computed,
  input
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

/**
 * CpsSidebarMenuItem is used to define the items of the CpsSidebarMenuComponent.
 * @group Types
 */
export type CpsSidebarMenuItem = {
  title: string;
  icon: string;
  url?: string;
  target?: string;
  disabled?: boolean;
  items?: CpsMenuItem[];
};

/**
 * CpsSidebarMenuComponent is a vertical menu panel component displayed at the edge of the screen.
 * @group Components
 */
@Component({
  selector: 'cps-sidebar-menu',
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
          marginTop: '0.375rem',
          opacity: '1'
        })
      ),
      transition('expanded <=> collapsed', [
        animate('0.2s cubic-bezier(0.4, 0, 0.2, 1)')
      ])
    ])
  ]
})
export class CpsSidebarMenuComponent {
  /**
   * An array of menu items.
   * @group Props
   */
  @Input() items: CpsSidebarMenuItem[] = [];

  /**
   * Indicates current expansion state of the sidebar.
   * @group Props
   */
  @Input() isExpanded = true;

  /**
   * Determines whether the menu items should allow activating only exact links.
   * @group Props
   */
  @Input() exactRoutes = false;

  /**
   * Aria label for the sidebar, used for accessibility.
   * @group Props
   */
  @Input() ariaLabel = 'Main navigation';

  /**
   * Height of the sidebar, of type number denoting pixels or string.
   * @group Props
   * @default 100%
   */
  height = input<number | string>('100%');

  @ViewChildren('popupMenu') allMenus?: QueryList<CpsMenuComponent>;

  focusedItemWithMenu: CpsSidebarMenuItem | null = null;

  // eslint-disable-next-line no-useless-constructor
  constructor(private _router: Router) {}

  cvtHeight = computed(() => convertSize(this.height()));

  showMenu(
    event: MouseEvent | FocusEvent,
    menu: CpsMenuComponent,
    item?: CpsSidebarMenuItem
  ) {
    if ((event.currentTarget as HTMLElement)?.classList.contains('disabled'))
      return;
    if (event.type === 'focusin' && item) {
      this.focusedItemWithMenu = item;
    }
    if (menu.isVisible()) {
      if (event.type === 'focusin') menu.show(null, event.currentTarget, 'tr');
      return;
    }
    this.allMenus?.forEach((m) => m.hide());
    menu.show(null, event.currentTarget, 'tr');
  }

  toggleMenu(
    event: MouseEvent,
    menu: CpsMenuComponent,
    item: CpsSidebarMenuItem
  ) {
    if ((event.currentTarget as HTMLElement)?.classList.contains('disabled'))
      return;

    this.focusedItemWithMenu = item;
    if (menu.isVisible()) {
      menu.hide();
    } else {
      this.allMenus?.forEach((m) => m.hide());
      menu.show(null, event.currentTarget as HTMLElement, 'tr');
    }
  }

  leaveMenu(event: MouseEvent | FocusEvent, menu: CpsMenuComponent) {
    const rel = event.relatedTarget as Node;
    if (
      !menu.container?.contains(rel) &&
      !(menu.target as HTMLElement)?.contains(rel)
    ) {
      menu.hide();
      if (event.type === 'focusout') {
        this.focusedItemWithMenu = null;
      }
    }
  }

  isActive(item: CpsSidebarMenuItem) {
    if (!item.items) return false;
    const urls = item.items.filter((i) => i.url).map((i) => i.url) as string[];

    if (this.exactRoutes) return urls.includes(this._router.url);
    return urls.some((url) => this._router.url.includes(url));
  }

  toggleSidebar() {
    this.isExpanded = !this.isExpanded;
  }
}
