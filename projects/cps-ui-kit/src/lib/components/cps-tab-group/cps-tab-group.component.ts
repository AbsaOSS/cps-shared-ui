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
  EventEmitter,
  Input,
  Output,
  QueryList
} from '@angular/core';
import { CpsIconComponent } from '../cps-icon/cps-icon.component';
import { CpsTabComponent } from './cps-tab/cps-tab.component';
import { CpsTooltipDirective } from '../../directives/cps-tooltip.directive';

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
export class CpsTabGroupComponent implements AfterContentInit, AfterViewInit {
  @ContentChildren(CpsTabComponent) tabs!: QueryList<CpsTabComponent>;

  @Input() selectedIndex = 0;
  @Input() isSubTabs = false; // applies an alternative styling to tabs
  @Input() animationType: 'slide' | 'fade' = 'slide';
  @Input() initAllTabsContent = false;

  animationState: 'slideLeft' | 'slideRight' | 'fadeIn' | 'fadeOut' =
    'slideLeft';

  @Output() beforeTabChanged = new EventEmitter<TabChangeEvent>();
  @Output() afterTabChanged = new EventEmitter<TabChangeEvent>();

  // eslint-disable-next-line no-useless-constructor
  constructor(private cdRef: ChangeDetectorRef) {}

  ngAfterContentInit() {
    this.selectTab(this.selectedIndex);
  }

  ngAfterViewInit() {
    this.cdRef.detectChanges();
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

  get selectedTab(): CpsTabComponent | undefined {
    return this.tabs.find((t) => t.active);
  }
}
