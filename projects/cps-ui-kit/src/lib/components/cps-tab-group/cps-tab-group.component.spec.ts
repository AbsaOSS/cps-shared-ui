import { Component } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CpsTabGroupComponent } from './cps-tab-group.component';
import { CpsTabComponent } from './cps-tab/cps-tab.component';

@Component({
  standalone: true,
  imports: [CpsTabGroupComponent, CpsTabComponent],
  template: `
    <cps-tab-group
      [selectedIndex]="selectedIndex"
      [animationType]="animationType"
      [autoActivation]="autoActivation"
      (beforeTabChanged)="onBefore($event)"
      (afterTabChanged)="onAfter($event)">
      <cps-tab label="Tab 1" badgeValue="3" badgeTooltip="Three items"
        >Content 1</cps-tab
      >
      <cps-tab label="Tab 2">Content 2</cps-tab>
      <cps-tab label="Tab 3" [disabled]="true">Content 3</cps-tab>
      <cps-tab label="Tab 4">Content 4</cps-tab>
    </cps-tab-group>
  `
})
class TestHostComponent {
  selectedIndex = 0;
  animationType: 'slide' | 'fade' = 'slide';
  autoActivation = true;
  beforeEvents: unknown[] = [];
  afterEvents: unknown[] = [];
  onBefore(e: unknown) {
    this.beforeEvents.push(e);
  }

  onAfter(e: unknown) {
    this.afterEvents.push(e);
  }
}

function getTabGroupInstance(
  fixture: ComponentFixture<TestHostComponent>
): CpsTabGroupComponent {
  return fixture.debugElement.query(By.directive(CpsTabGroupComponent))
    .componentInstance;
}

function getTabEls(
  fixture: ComponentFixture<TestHostComponent>
): HTMLElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('[role="tab"]'));
}

function dispatchKeydown(el: HTMLElement, key: string): void {
  el.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
  );
}

describe('CpsTabGroupComponent', () => {
  let hostFixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let component: CpsTabGroupComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, NoopAnimationsModule]
    }).compileComponents();

    hostFixture = TestBed.createComponent(TestHostComponent);
    host = hostFixture.componentInstance;
    hostFixture.detectChanges();
    component = getTabGroupInstance(hostFixture);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default property values', () => {
    expect(component.isSubTabs).toBe(false);
    expect(component.alignment).toBe('left');
    expect(component.autoActivation).toBe(true);
    expect(component.stretched).toBe(false);
    expect(component.animationType).toBe('slide');
    expect(component.contentWrapClass).toBe('');
    expect(component.headerClass).toBe('');
  });

  it('should render four tab headers', () => {
    expect(getTabEls(hostFixture).length).toBe(4);
  });

  it('should activate the first tab by default', () => {
    const tabs = component.tabs.toArray();
    expect(tabs[0].active).toBe(true);
    expect(tabs[1].active).toBe(false);
  });

  it('should render tab labels', () => {
    const tabEls = getTabEls(hostFixture);
    expect(tabEls[0].textContent).toContain('Tab 1');
    expect(tabEls[1].textContent).toContain('Tab 2');
  });

  it('should mark disabled tab with aria-disabled', () => {
    const tabEls = getTabEls(hostFixture);
    expect(tabEls[2].getAttribute('aria-disabled')).toBe('true');
  });

  it('should set aria-selected on active tab', () => {
    const tabEls = getTabEls(hostFixture);
    expect(tabEls[0].getAttribute('aria-selected')).toBe('true');
    expect(tabEls[1].getAttribute('aria-selected')).toBe('false');
  });

  it('should set tabindex 0 on active tab and -1 on others', () => {
    const tabEls = getTabEls(hostFixture);
    expect(tabEls[0].getAttribute('tabindex')).toBe('0');
    expect(tabEls[1].getAttribute('tabindex')).toBe('-1');
  });

  it('should render content of the active tab', () => {
    const panel = hostFixture.nativeElement.querySelector('[role="tabpanel"]');
    expect(panel).toBeTruthy();
    expect(panel.textContent).toContain('Content 1');
  });

  it('should apply center-aligned class', () => {
    component.alignment = 'center';
    hostFixture.detectChanges();
    const tabs = hostFixture.nativeElement.querySelector('.cps-tabs');
    expect(tabs.classList).toContain('cps-tabs-center-aligned');
  });

  it('should apply right-aligned class', () => {
    component.alignment = 'right';
    hostFixture.detectChanges();
    const tabs = hostFixture.nativeElement.querySelector('.cps-tabs');
    expect(tabs.classList).toContain('cps-tabs-right-aligned');
  });

  it('should apply stretched class', () => {
    component.stretched = true;
    hostFixture.detectChanges();
    const tabs = hostFixture.nativeElement.querySelector('.cps-tabs');
    expect(tabs.classList).toContain('cps-tabs-stretched');
  });

  it('should apply subtabs class when isSubTabs is true', () => {
    component.isSubTabs = true;
    hostFixture.detectChanges();
    const tabs = hostFixture.nativeElement.querySelector('.cps-tabs');
    expect(tabs.classList).toContain('cps-tabs-subtabs');
  });

  it('should activate the tab at selectedIndex', () => {
    host.selectedIndex = 1;
    hostFixture.detectChanges();
    const tabs = component.tabs.toArray();
    expect(tabs[1].active).toBe(true);
    expect(tabs[0].active).toBe(false);
  });

  it('should activate a disabled tab when selectedIndex points to it programmatically', () => {
    host.selectedIndex = 2;
    hostFixture.detectChanges();
    const tabs = component.tabs.toArray();
    expect(tabs[2].active).toBe(true);
  });

  it('should activate tab on click', () => {
    component.onTabClick(1);
    hostFixture.detectChanges();
    const tabs = component.tabs.toArray();
    expect(tabs[1].active).toBe(true);
    expect(tabs[0].active).toBe(false);
  });

  it('should emit beforeTabChanged on click', () => {
    jest.spyOn(component.beforeTabChanged, 'emit');
    component.onTabClick(1);
    expect(component.beforeTabChanged.emit).toHaveBeenCalledWith({
      previousIndex: 0,
      newIndex: 1
    });
  });

  it('should emit afterTabChanged on click (slide)', () => {
    jest.spyOn(component.afterTabChanged, 'emit');
    component.onTabClick(1);
    expect(component.afterTabChanged.emit).toHaveBeenCalledWith({
      previousIndex: 0,
      newIndex: 1
    });
  });

  it('should emit afterTabChanged after timeout on click (fade)', fakeAsync(() => {
    host.animationType = 'fade';
    hostFixture.detectChanges();
    jest.spyOn(component.afterTabChanged, 'emit');
    component.onTabClick(1);
    expect(component.afterTabChanged.emit).not.toHaveBeenCalled();
    tick(100);
    expect(component.afterTabChanged.emit).toHaveBeenCalledWith({
      previousIndex: 0,
      newIndex: 1
    });
  }));

  it('should not activate disabled tab on click via template', () => {
    const tabEls = getTabEls(hostFixture);
    tabEls[2].click();
    hostFixture.detectChanges();
    const tabs = component.tabs.toArray();
    expect(tabs[2].active).toBe(false);
    expect(tabs[0].active).toBe(true);
  });

  it('should not emit events when same tab is clicked again', () => {
    jest.spyOn(component.beforeTabChanged, 'emit');
    component.onTabClick(0);
    expect(component.beforeTabChanged.emit).not.toHaveBeenCalled();
  });

  it('should not emit events when selectTab is called with silent=true', () => {
    jest.spyOn(component.beforeTabChanged, 'emit');
    jest.spyOn(component.afterTabChanged, 'emit');
    component.selectedIndex = 1;
    component.selectTab(true);
    expect(component.beforeTabChanged.emit).not.toHaveBeenCalled();
    expect(component.afterTabChanged.emit).not.toHaveBeenCalled();
  });

  it('should set slideRight animation when moving forward', () => {
    component.onTabClick(1);
    expect(component.animationState).toBe('slideRight');
  });

  it('should set slideLeft animation when moving backward', () => {
    component.onTabClick(1);
    component.onTabClick(0);
    expect(component.animationState).toBe('slideLeft');
  });

  it('should set fadeOut animation state on tab change (fade)', fakeAsync(() => {
    host.animationType = 'fade';
    hostFixture.detectChanges();
    component.onTabClick(1);
    expect(component.animationState).toBe('fadeOut');
    tick(100);
    expect(component.animationState).toBe('fadeIn');
  }));

  it('should move to next tab on ArrowRight', () => {
    const tabEls = getTabEls(hostFixture);
    dispatchKeydown(tabEls[0], 'ArrowRight');
    hostFixture.detectChanges();
    expect(component.tabs.toArray()[1].active).toBe(true);
  });

  it('should skip disabled tab on ArrowRight', () => {
    component.onTabClick(1);
    hostFixture.detectChanges();
    const tabEls = getTabEls(hostFixture);
    dispatchKeydown(tabEls[1], 'ArrowRight');
    hostFixture.detectChanges();
    expect(component.tabs.toArray()[3].active).toBe(true);
  });

  it('should wrap around to first tab on ArrowRight from last enabled tab', () => {
    component.onTabClick(3);
    hostFixture.detectChanges();
    const tabEls = getTabEls(hostFixture);
    dispatchKeydown(tabEls[3], 'ArrowRight');
    hostFixture.detectChanges();
    expect(component.tabs.toArray()[0].active).toBe(true);
  });

  it('should move to previous tab on ArrowLeft', () => {
    component.onTabClick(1);
    hostFixture.detectChanges();
    const tabEls = getTabEls(hostFixture);
    dispatchKeydown(tabEls[1], 'ArrowLeft');
    hostFixture.detectChanges();
    expect(component.tabs.toArray()[0].active).toBe(true);
  });

  it('should skip disabled tab on ArrowLeft', () => {
    component.onTabClick(3);
    hostFixture.detectChanges();
    const tabEls = getTabEls(hostFixture);
    dispatchKeydown(tabEls[3], 'ArrowLeft');
    hostFixture.detectChanges();
    expect(component.tabs.toArray()[1].active).toBe(true);
  });

  it('should wrap around to last enabled tab on ArrowLeft from first tab', () => {
    const tabEls = getTabEls(hostFixture);
    dispatchKeydown(tabEls[0], 'ArrowLeft');
    hostFixture.detectChanges();
    expect(component.tabs.toArray()[3].active).toBe(true);
  });

  it('should move to first enabled tab on Home', () => {
    component.onTabClick(3);
    hostFixture.detectChanges();
    const tabEls = getTabEls(hostFixture);
    dispatchKeydown(tabEls[3], 'Home');
    hostFixture.detectChanges();
    expect(component.tabs.toArray()[0].active).toBe(true);
  });

  it('should move to last enabled tab on End', () => {
    const tabEls = getTabEls(hostFixture);
    dispatchKeydown(tabEls[0], 'End');
    hostFixture.detectChanges();
    expect(component.tabs.toArray()[3].active).toBe(true);
  });

  it('should not activate on ArrowRight when autoActivation is false (only focuses)', () => {
    host.autoActivation = false;
    hostFixture.detectChanges();
    const tabEls = getTabEls(hostFixture);
    dispatchKeydown(tabEls[0], 'ArrowRight');
    hostFixture.detectChanges();
    expect(component.tabs.toArray()[0].active).toBe(true);
  });

  it('should activate focused tab on Enter when autoActivation is false', () => {
    host.autoActivation = false;
    hostFixture.detectChanges();
    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true
    });
    component.onTabKeydown(event, 1);
    hostFixture.detectChanges();
    expect(component.tabs.toArray()[1].active).toBe(true);
  });

  it('should activate focused tab on Space when autoActivation is false', () => {
    host.autoActivation = false;
    hostFixture.detectChanges();
    const event = new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true,
      cancelable: true
    });
    component.onTabKeydown(event, 3);
    hostFixture.detectChanges();
    expect(component.tabs.toArray()[3].active).toBe(true);
  });

  it('should not activate disabled tab on Enter when autoActivation is false', () => {
    host.autoActivation = false;
    hostFixture.detectChanges();
    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true
    });
    component.onTabKeydown(event, 2);
    hostFixture.detectChanges();
    expect(component.tabs.toArray()[2].active).toBe(false);
  });

  it('should return label when no badge', () => {
    const tab = component.tabs.toArray()[1];
    expect(component.getTabAriaLabel(tab)).toBe('Tab 2');
  });

  it('should include badge value and tooltip in aria-label', () => {
    const tab = component.tabs.toArray()[0];
    expect(component.getTabAriaLabel(tab)).toBe('Tab 1, Badge: 3, Three items');
  });

  it('should use ariaLabel over label when set', () => {
    const tab = component.tabs.toArray()[1];
    tab.ariaLabel = 'Custom aria';
    expect(component.getTabAriaLabel(tab)).toBe('Custom aria');
  });

  it('should return null when label and ariaLabel are empty', () => {
    const tab = component.tabs.toArray()[1];
    tab.ariaLabel = '';
    tab.label = '';
    expect(component.getTabAriaLabel(tab)).toBeNull();
  });

  it('should return tab id with correct format', () => {
    const id = component.getTabId(0);
    expect(id).toMatch(/^cps-tab-group-.+-tab-0$/);
  });

  it('should return panel id with correct format', () => {
    const id = component.getPanelId(0);
    expect(id).toMatch(/^cps-tab-group-.+-panel-0$/);
  });

  it('should link tab aria-controls to panel id', () => {
    const tabEl = getTabEls(hostFixture)[0];
    const panelId = component.getPanelId(0);
    expect(tabEl.getAttribute('aria-controls')).toBe(panelId);
  });

  it('should link panel aria-labelledby to tab id', () => {
    const panel = hostFixture.nativeElement.querySelector('[role="tabpanel"]');
    const tabId = component.getTabId(0);
    expect(panel.getAttribute('aria-labelledby')).toBe(tabId);
  });

  it('selectedTab should return the currently active tab', () => {
    expect(component.selectedTab).toBe(component.tabs.toArray()[0]);
    component.onTabClick(1);
    expect(component.selectedTab).toBe(component.tabs.toArray()[1]);
  });

  it('should unsubscribe on destroy', () => {
    const unsubSpy = jest.spyOn(component.windowResize$, 'unsubscribe');
    component.ngOnDestroy();
    expect(unsubSpy).toHaveBeenCalled();
  });
});
