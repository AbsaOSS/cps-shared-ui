import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import { CommonModule, DOCUMENT } from '@angular/common';
import {
  AfterContentInit,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  ViewChild,
  afterRenderEffect,
  signal,
  viewChildren
} from '@angular/core';
import { CpsIconComponent } from '../cps-icon/cps-icon.component';
import { CpsTabComponent } from './cps-tab/cps-tab.component';
import { CpsTooltipDirective } from '../../directives/cps-tooltip/cps-tooltip.directive';
import { getCSSColor } from '../../utils/colors-utils';
import { generateUniqueId } from '../../utils/internal/accessibility-utils';
import {
  Subscription,
  debounceTime,
  distinctUntilChanged,
  fromEvent
} from 'rxjs';

/**
 * CpsTabChangeEvent is used to define the tab change event.
 * @group Interface
 */
export interface CpsTabChangeEvent {
  /**
   * Index of the previous tab.
   */
  previousIndex: number;
  /**
   * Index of the new tab.
   */
  newIndex: number;
}

/**
 * CpsTabsAnimationType is used to define the transition options of how content appears.
 * @group Types
 */
export type CpsTabsAnimationType = 'slide' | 'fade';

/**
 * CpsTabsAlignmentType is used to define the horizontal alignment of tabs.
 * @group Types
 */
export type CpsTabsAlignmentType = 'left' | 'center' | 'right';

/**
 * CpsTabGroupComponent is a navigation component that displays items as tab headers.
 * @group Components
 */
@Component({
  imports: [CommonModule, CpsIconComponent, CpsTooltipDirective],
  selector: 'cps-tab-group',
  templateUrl: './cps-tab-group.component.html',
  styleUrls: ['./cps-tab-group.component.scss'],
  animations: [
    trigger('slideInOut', [
      state('slideLeft', style({ transform: 'translateX(0)' })),
      state('slideRight', style({ transform: 'translateX(0)' })),
      transition('* => slideLeft', [
        style({ transform: 'translateX(-100%)' }),
        animate('200ms ease-in')
      ]),
      transition('* => slideRight', [
        style({ transform: 'translateX(100%)' }),
        animate('200ms ease-in')
      ]),
      transition('void => *', animate(0))
    ]),
    trigger('fadeInOut', [
      state('fadeIn', style({ opacity: 1 })),
      state('fadeOut', style({ opacity: 0 })),
      transition('fadeOut => fadeIn', [
        style({ opacity: 0 }),
        animate('100ms ease-in')
      ]),
      transition('fadeIn => fadeOut', [
        animate('0ms ease-out', style({ opacity: 0 }))
      ]),
      transition('void => *', animate(0))
    ])
  ]
})
export class CpsTabGroupComponent
  implements OnInit, AfterContentInit, AfterViewInit, OnChanges, OnDestroy
{
  /**
   * Index of the selected tab.
   * @default 0
   * @group Props
   */
  @Input() set selectedIndex(value: number) {
    this._previousTabIndex = this._currentTabIndex;
    this._currentTabIndex = value;
  }

  get selectedIndex(): number {
    return this._currentTabIndex;
  }

  /**
   * Determines whether to apply an alternative 'subtabs' styling.
   * @group Props
   */
  @Input() isSubTabs = false;

  /**
   * Horizontal alignment of tabs.
   * @group Props
   */
  @Input() alignment: CpsTabsAlignmentType = 'left';

  /**
   * When true, tabs activate automatically as focus moves between them via arrow keys.
   * When false, arrow keys only move focus; press Enter or Space to activate the focused tab.
   * @group Props
   */
  @Input() autoActivation = true;

  /**
   * Class to apply to the tab content wrapper.
   * @group Props
   */
  @Input() contentWrapClass = '';

  /**
   * Class to apply to the tab header.
   * @group Props
   */
  @Input() headerClass = '';

  /**
   * Determines whether to stretch tabs to fill the available horizontal space.
   * @group Props
   */
  @Input() stretched = false;

  /**
   * Transition options of how content appears, it can be "slide" or "fade".
   * @group Props
   */
  @Input() animationType: CpsTabsAnimationType = 'slide';

  /**
   * Background color of navigation buttons.
   * @group Props
   */
  @Input() navButtonsBackground = 'inherit';

  /**
   * Background color of tabs.
   * @group Props
   */
  @Input() tabsBackground = 'inherit';

  /**
   * Callback to invoke before tab change.
   * @param {CpsTabChangeEvent} any - tab change event.
   * @group Emits
   */
  @Output() beforeTabChanged = new EventEmitter<CpsTabChangeEvent>();

  /**
   * Callback to invoke after tab change.
   * @param {CpsTabChangeEvent} any - tab change event.
   * @group Emits
   */
  @Output() afterTabChanged = new EventEmitter<CpsTabChangeEvent>();

  @ViewChild('tabsList') tabsList!: ElementRef;
  @ViewChild('backBtn') backBtn?: ElementRef;
  @ViewChild('forwardBtn') forwardBtn?: ElementRef;

  @ContentChildren(CpsTabComponent) tabs!: QueryList<CpsTabComponent>;

  backBtnVisible = false;
  forwardBtnVisible = false;
  animationState: 'slideLeft' | 'slideRight' | 'fadeIn' | 'fadeOut' = 'fadeIn';

  readonly tabGroupId = generateUniqueId('cps-tab-group');

  windowResize$: Subscription = Subscription.EMPTY;
  listScroll$: Subscription = Subscription.EMPTY;

  private readonly _tabPanelEls = viewChildren<ElementRef>('tabPanel');

  readonly panelTabindex = signal(0);

  private _currentTabIndex = 0;
  private _previousTabIndex = 0;

  // eslint-disable-next-line no-useless-constructor
  constructor(
    private cdRef: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: Document
  ) {
    afterRenderEffect(() => {
      const activeEl =
        this._tabPanelEls()[this._currentTabIndex]?.nativeElement;
      this.panelTabindex.set(
        activeEl && this._hasFocusableIn(activeEl) ? -1 : 0
      );
    });
  }

  ngOnInit(): void {
    this.tabsBackground = getCSSColor(this.tabsBackground, this.document);
    this.navButtonsBackground = getCSSColor(
      this.navButtonsBackground,
      this.document
    );

    this.windowResize$ = fromEvent(window, 'resize')
      .pipe(debounceTime(50), distinctUntilChanged())
      .subscribe(() => this.onResize());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.selectedIndex && !changes.selectedIndex.firstChange) {
      this.selectTab();
    }
  }

  ngAfterContentInit() {
    this.selectTab(true);
  }

  ngAfterViewInit() {
    this._updateNavBtnsState();

    this.listScroll$ = fromEvent(this.tabsList.nativeElement, 'scroll')
      .pipe(debounceTime(50), distinctUntilChanged())
      .subscribe((event: any) => this.onScroll(event));

    this.cdRef.detectChanges();
  }

  ngOnDestroy(): void {
    this.windowResize$?.unsubscribe();
    this.listScroll$?.unsubscribe();
  }

  get selectedTab(): CpsTabComponent | undefined {
    return this.tabs.find((t) => t.active);
  }

  getTabId(index: number): string {
    return `${this.tabGroupId}-tab-${index}`;
  }

  getPanelId(index: number): string {
    return `${this.tabGroupId}-panel-${index}`;
  }

  getTabFocusOrderTabIndex(tabIndex: number): 0 | -1 {
    const _tabs = this.tabs.toArray();
    const activeTab = _tabs[this._currentTabIndex];
    if (!activeTab?.disabled) {
      return tabIndex === this._currentTabIndex ? 0 : -1;
    }
    // Edge case: active tab is disabled - move focus to the first non-disabled tab
    const firstEnabled = _tabs.findIndex((t) => !t.disabled);
    return tabIndex === firstEnabled ? 0 : -1;
  }

  getTabAriaLabel(tab: CpsTabComponent): string | null {
    const label = tab.ariaLabel || tab.label;
    const badgeValue = tab.badgeValue.trim();

    if (!badgeValue) {
      return label || null;
    }

    const badgeTooltip = tab.badgeTooltip.trim();
    return `${label}, Badge: ${badgeValue}${badgeTooltip ? `, ${badgeTooltip}` : ''}`;
  }

  onTabClick(index: number) {
    if (index === this.selectedIndex) return;
    this.selectedIndex = index;
    this.selectTab();
  }

  onTabKeydown(event: KeyboardEvent, index: number): void {
    const _tabs = this.tabs.toArray();
    let targetIndex: number | null = null;

    switch (event.key) {
      case 'ArrowRight':
        targetIndex = this._nextEnabledTab(index, 1, _tabs);
        break;
      case 'ArrowLeft':
        targetIndex = this._nextEnabledTab(index, -1, _tabs);
        break;
      case 'Home': {
        const first = _tabs.findIndex((t) => !t.disabled);
        targetIndex = first !== -1 ? first : null;
        break;
      }
      case 'End': {
        const last = _tabs.map((t) => !t.disabled).lastIndexOf(true);
        targetIndex = last !== -1 ? last : null;
        break;
      }
      case 'Enter':
      case ' ':
        if (!_tabs[index]?.disabled) {
          event.preventDefault();
          this.onTabClick(index);
        }
        return;
      default:
        return;
    }

    if (targetIndex == null) return;

    event.preventDefault();
    if (this.autoActivation) {
      this.onTabClick(targetIndex);
    }
    const tabEls = Array.from<HTMLElement>(
      this.tabsList.nativeElement.querySelectorAll('[role="tab"]')
    );
    const targetEl = tabEls[targetIndex];
    if (targetEl) {
      this._scrollTabIntoView(targetEl);
      targetEl.focus({ preventScroll: true });
    }
  }

  private _scrollTabIntoView(tabEl: HTMLElement): void {
    const list: HTMLElement = this.tabsList.nativeElement;
    const backW = this.backBtn?.nativeElement?.offsetWidth ?? 0;
    const fwdW = this.forwardBtn?.nativeElement?.offsetWidth ?? 0;

    const tabStart = tabEl.offsetLeft;
    const tabEnd = tabStart + tabEl.offsetWidth;
    const viewStart = list.scrollLeft + backW;
    const viewEnd = list.scrollLeft + list.clientWidth - fwdW;

    if (tabStart < viewStart) {
      list.scrollLeft = tabStart - backW;
    } else if (tabEnd > viewEnd) {
      list.scrollLeft = tabEnd + fwdW - list.clientWidth;
    }
  }

  private _hasFocusableIn(container: HTMLElement): boolean {
    const walker = this.document.createTreeWalker(
      container,
      NodeFilter.SHOW_ELEMENT
    );
    while (walker.nextNode()) {
      const el = walker.currentNode as HTMLElement & { disabled?: boolean };
      if (el.tabIndex >= 0 && !el.disabled) return true;
    }
    return false;
  }

  private _nextEnabledTab(
    from: number,
    direction: 1 | -1,
    tabs: CpsTabComponent[]
  ): number | null {
    const len = tabs.length;
    if (direction === 1) {
      for (let i = from + 1; i < len; i++) {
        if (!tabs[i].disabled) return i;
      }
      for (let i = 0; i < from; i++) {
        if (!tabs[i].disabled) return i;
      }
    } else {
      for (let i = from - 1; i >= 0; i--) {
        if (!tabs[i].disabled) return i;
      }
      for (let i = len - 1; i > from; i--) {
        if (!tabs[i].disabled) return i;
      }
    }
    return null;
  }

  selectTab(silent = false) {
    const _tabs = this.tabs.toArray();

    const currentSelectedTab = _tabs[this._previousTabIndex];
    if (currentSelectedTab) {
      currentSelectedTab.active = false;
    }

    const newSelectedTab = _tabs[this._currentTabIndex];
    if (newSelectedTab) {
      newSelectedTab.active = true;
    }

    if (this._currentTabIndex === this._previousTabIndex) {
      return;
    }

    if (!silent) {
      this.beforeTabChanged.emit({
        previousIndex: this._previousTabIndex,
        newIndex: this._currentTabIndex
      });
    }

    if (this.animationType === 'slide') {
      this.animationState =
        this._currentTabIndex < this._previousTabIndex
          ? 'slideLeft'
          : 'slideRight';

      if (!silent) {
        this.afterTabChanged.emit({
          previousIndex: this._previousTabIndex,
          newIndex: this._currentTabIndex
        });
      }
    } else if (this.animationType === 'fade') {
      this.animationState = 'fadeOut';
      setTimeout(() => {
        this.animationState = 'fadeIn';
        if (!silent) {
          this.afterTabChanged.emit({
            previousIndex: this._previousTabIndex,
            newIndex: this._currentTabIndex
          });
        }
      }, 100);
    }
  }

  onScroll(event: any) {
    this._updateNavBtnsState();
    event.preventDefault();
  }

  onResize() {
    this._updateNavBtnsState();
  }

  navBackward() {
    const content = this.tabsList.nativeElement;
    const width = this._getWidth(content) - this._getVisibleButtonWidths();
    const pos = content.scrollLeft - width;
    content.scrollLeft = pos <= 0 ? 0 : pos;
  }

  navForward() {
    const content = this.tabsList.nativeElement;
    const width = this._getWidth(content) - this._getVisibleButtonWidths();
    const pos = content.scrollLeft + width;
    const lastPos = content.scrollWidth - width;
    content.scrollLeft = pos >= lastPos ? lastPos : pos;
  }

  private _updateNavBtnsState() {
    const content = this.tabsList.nativeElement;
    const { scrollLeft, scrollWidth } = content;

    const width = this._getWidth(content);

    this.backBtnVisible = scrollLeft === 0;
    this.forwardBtnVisible = Math.abs(scrollLeft - scrollWidth + width) < 2;
  }

  private _getVisibleButtonWidths() {
    return [this.backBtn?.nativeElement, this.forwardBtn?.nativeElement].reduce(
      (acc, el) => (el ? acc + this._getWidth(el) : acc),
      0
    );
  }

  private _getWidth(el: any): number {
    let width = el.offsetWidth;
    if (!width) return width;

    const style = getComputedStyle(el);

    width -=
      parseFloat(style.paddingLeft) +
      parseFloat(style.paddingRight) +
      parseFloat(style.borderLeftWidth) +
      parseFloat(style.borderRightWidth);

    return width;
  }
}
