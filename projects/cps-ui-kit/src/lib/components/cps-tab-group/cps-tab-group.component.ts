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

export interface TabChangeEvent {
  currentTabIndex: number;
  newTabIndex?: number;
}

@Component({
  standalone: true,
  imports: [CommonModule, CpsIconComponent, CpsTabComponent],
  selector: 'cps-tab-group',
  templateUrl: './cps-tab-group.component.html',
  styleUrls: ['./cps-tab-group.component.scss'],
  animations: [
    trigger('slideInOut', [
      state('left', style({ transform: 'translateX(0)' })),
      state('right', style({ transform: 'translateX(0)' })),
      transition('* => left', [
        style({ transform: 'translateX(-100%)' }),
        animate('200ms ease-in')
      ]),
      transition('* => right', [
        style({ transform: 'translateX(100%)' }),
        animate('200ms ease-in')
      ])
    ])
  ]
})
export class CpsTabGroupComponent implements AfterContentInit, AfterViewInit {
  @ContentChildren(CpsTabComponent) tabs!: QueryList<CpsTabComponent>;

  @Input() selectedIndex = 0;
  animationState: 'left' | 'right' = 'left';

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
    this.animationState =
      newSelectedIndex < this.selectedIndex ? 'left' : 'right';
    this.selectedIndex = newSelectedIndex;

    this.afterTabChanged.emit({
      currentTabIndex: newSelectedIndex
    });
  }

  get selectedTab(): CpsTabComponent | undefined {
    return this.tabs.find((t) => t.active);
  }
}
