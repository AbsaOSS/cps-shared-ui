import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  PLATFORM_ID,
  QueryList,
  ViewChild,
  ViewChildren,
  computed,
  inject,
  input
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CpsMenuComponent, CpsMenuItem } from '../cps-menu/cps-menu.component';
import {
  CpsIconComponent,
  type CpsIconType
} from '../cps-icon/cps-icon.component';
import { convertSize } from '../../utils/internal/size-utils/size-utils';
import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import {
  prefersReducedMotion,
  REDUCED_MOTION_DURATION
} from '../../utils/internal/motion-utils/motion-utils';

/**
 * CpsSidebarMenuItem is used to define the items of the CpsSidebarMenuComponent.
 * @group Types
 */
export type CpsSidebarMenuItem = {
  title: string;
  icon: CpsIconType;
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
      transition('expanded <=> collapsed', [animate('{{transitionParams}}')], {
        params: { transitionParams: '0.2s cubic-bezier(0.4, 0, 0.2, 1)' }
      })
    ])
  ]
})
export class CpsSidebarMenuComponent implements AfterViewInit {
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

  get resolvedTransitionParams(): string {
    return prefersReducedMotion()
      ? REDUCED_MOTION_DURATION
      : '0.2s cubic-bezier(0.4, 0, 0.2, 1)';
  }

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

  @ViewChild('expandAreaBtn')
  private _expandAreaBtn?: ElementRef<HTMLButtonElement>;

  @ViewChildren('popupMenu') allMenus?: QueryList<CpsMenuComponent>;

  focusedItemWithMenu: CpsSidebarMenuItem | null = null;

  private readonly _elementRef = inject(ElementRef<HTMLElement>);
  private readonly _router = inject(Router);
  private readonly _platformId = inject(PLATFORM_ID);

  private _pendingTouch = false;

  onMenuItemTouchStart(): void {
    this._pendingTouch = true;
  }

  ngAfterViewInit(): void {
    this._applyExpandButtonBackground();
  }

  cvtHeight = computed(() => convertSize(this.height()));

  showMenu(
    event: MouseEvent | FocusEvent,
    menu: CpsMenuComponent,
    item?: CpsSidebarMenuItem
  ) {
    if ((event.currentTarget as HTMLElement)?.classList.contains('disabled'))
      return;
    if (
      this._pendingTouch &&
      (event.type === 'mouseenter' || event.type === 'focusin')
    )
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
    this._pendingTouch = false;
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
    if (this._pendingTouch && event.type === 'mouseleave') return;
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

  private _applyExpandButtonBackground(): void {
    if (!isPlatformBrowser(this._platformId)) return;
    const bg = this._resolveBackground(this._elementRef.nativeElement);
    if (bg && this._expandAreaBtn) {
      this._expandAreaBtn.nativeElement.style.backgroundColor = bg;
    }
  }

  private _resolveBackground(el: HTMLElement): string | null {
    let node: HTMLElement | null = el.parentElement;
    while (node) {
      const bg = getComputedStyle(node).backgroundColor;
      if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') return bg;
      node = node.parentElement;
    }
    return null;
  }
}
