import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import { CommonModule } from '@angular/common';
import {
  AfterContentInit,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  ViewChild
} from '@angular/core';
import { CpsIconComponent } from '../cps-icon/cps-icon.component';
import { CpsTabComponent } from './cps-tab/cps-tab.component';
import { CpsTooltipDirective } from '../../directives/cps-tooltip.directive';
import { getCSSColor } from '../../utils/colors-utils';
import {
  Subscription,
  debounceTime,
  distinctUntilChanged,
  fromEvent
} from 'rxjs';

export interface TabChangeEvent {
  currentTabIndex: number;
  newTabIndex?: number;
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    CpsIconComponent,
    CpsTabComponent,
    CpsTooltipDirective
  ],
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
      ])
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
      ])
    ])
  ]
})
export class CpsTabGroupComponent
  implements OnInit, AfterContentInit, AfterViewInit, OnDestroy
{
  @Input() selectedIndex = 0;
  @Input() isSubTabs = false; // applies an alternative styling to tabs
  @Input() animationType: 'slide' | 'fade' = 'slide';
  @Input() initAllTabsContent = false;
  @Input() tabsBackground = 'inherit';

  @Output() beforeTabChanged = new EventEmitter<TabChangeEvent>();
  @Output() afterTabChanged = new EventEmitter<TabChangeEvent>();

  @ViewChild('tabsList') tabsList!: ElementRef;
  @ViewChild('backBtn') backBtn?: ElementRef;
  @ViewChild('forwardBtn') forwardBtn?: ElementRef;

  @ContentChildren(CpsTabComponent) tabs!: QueryList<CpsTabComponent>;

  backBtnVisible = false;
  forwardBtnVisible = false;
  animationState: 'slideLeft' | 'slideRight' | 'fadeIn' | 'fadeOut' =
    'slideLeft';

  windowResize$: Subscription = Subscription.EMPTY;
  listScroll$: Subscription = Subscription.EMPTY;

  // eslint-disable-next-line no-useless-constructor
  constructor(private cdRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.tabsBackground = getCSSColor(this.tabsBackground);

    this.windowResize$ = fromEvent(window, 'resize')
      .pipe(debounceTime(50), distinctUntilChanged())
      .subscribe(() => this.onResize());
  }

  ngAfterContentInit() {
    this.selectTab(this.selectedIndex);
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

  selectTab(newSelectedIndex: number) {
    const _tabs = this.tabs.toArray();
    const currentSelectedTab = _tabs && _tabs[this.selectedIndex];

    this.beforeTabChanged.emit({
      currentTabIndex: this.selectedIndex,
      newTabIndex: newSelectedIndex
    });

    currentSelectedTab && (currentSelectedTab.active = false);
    const newSelectedTab = _tabs && _tabs[newSelectedIndex];
    newSelectedTab && (newSelectedTab.active = true);
    if (newSelectedIndex === this.selectedIndex) {
      return;
    }

    if (this.animationType === 'slide') {
      this.animationState =
        newSelectedIndex < this.selectedIndex ? 'slideLeft' : 'slideRight';
      this.selectedIndex = newSelectedIndex;

      this.afterTabChanged.emit({
        currentTabIndex: newSelectedIndex
      });
    } else if (this.animationType === 'fade') {
      this.animationState = 'fadeOut';
      setTimeout(() => {
        this.animationState = 'fadeIn';
        this.selectedIndex = newSelectedIndex;
        this.afterTabChanged.emit({
          currentTabIndex: newSelectedIndex
        });
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
    const style = getComputedStyle(el);

    width -=
      parseFloat(style.paddingLeft) +
      parseFloat(style.paddingRight) +
      parseFloat(style.borderLeftWidth) +
      parseFloat(style.borderRightWidth);

    return width;
  }
}
