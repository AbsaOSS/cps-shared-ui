import { animate, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { AfterContentInit, Component, ContentChildren, Input, QueryList } from '@angular/core';
import { CpsIconComponent } from 'projects/cps-ui-kit/src/lib/components/cps-icon/cps-icon.component';
import { CpsTabComponent } from './cps-tab/cps-tab.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    CpsIconComponent,
    CpsTabComponent
  ],
  selector: 'cps-tab-group',
  templateUrl: './cps-tab-group.component.html',
  styleUrls: ['./cps-tab-group.component.scss'],
  animations: [
    trigger('slideInOut', [
      state('left', style({transform: 'translateX(0)'})),
      state('right', style({transform: 'translateX(0)'})),
      transition('* => left', [
        style({transform: 'translateX(-100%)'}),
        animate('200ms ease-in')
      ]),
      transition('* => right', [
        style({transform: 'translateX(100%)'}),
        animate('200ms ease-in')
      ])
    ])
  ]
})
export class CpsTabGroupComponent implements AfterContentInit {
  @ContentChildren(CpsTabComponent) tabs!: QueryList<CpsTabComponent>;

  @Input() selectedIndex = 0;
  animationState: 'left' | 'right' = 'left';

  ngAfterContentInit() {
    this.selectTab(this.selectedIndex);
  }

  selectTab(newSelectedIndex: number) {
    const _tabs = this.tabs.toArray();
    const currentSelectedTab = _tabs && _tabs[this.selectedIndex];
    currentSelectedTab && (currentSelectedTab.active = false);
    const newSelectedTab = _tabs && _tabs[newSelectedIndex];
    newSelectedTab && (newSelectedTab.active = true);
    this.animationState = newSelectedIndex < this.selectedIndex ? 'left' : 'right';
    this.selectedIndex = newSelectedIndex;
  }

  get selectedTab(): CpsTabComponent | undefined {
    return this.tabs.find(t => t.active);
  }
}
