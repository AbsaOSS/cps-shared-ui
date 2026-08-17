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

  it('should not move focus on an unhandled key', () => {
    const tabEls = getTabEls(hostFixture);
    expect(() => dispatchKeydown(tabEls[0], 'Escape')).not.toThrow();
    hostFixture.detectChanges();
    expect(component.tabs.toArray()[0].active).toBe(true);
  });

  it('should suppress the focus ring on mousedown', () => {
    const suppressSpy = jest.spyOn(
      (component as any)._focusService,
      'suppressNextFocusRing'
    );
    const tabEl = getTabEls(hostFixture)[0];
    tabEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(suppressSpy).toHaveBeenCalledWith(tabEl);
  });

  it('should not append badge tooltip suffix when badgeTooltip is empty', () => {
    const tab = component.tabs.toArray()[0];
    tab.badgeTooltip = '';
    expect(component.getTabAriaLabel(tab)).toBe('Tab 1, Badge: 3');
  });

  it('should return null targetIndex when no other tab is enabled', () => {
    host.selectedIndex = 1;
    hostFixture.detectChanges();
    component.tabs.toArray().forEach((t, i) => {
      t.disabled = i !== 1;
    });
    hostFixture.detectChanges();
    const tabEls = getTabEls(hostFixture);
    expect(() => dispatchKeydown(tabEls[1], 'ArrowRight')).not.toThrow();
    hostFixture.detectChanges();
    expect(component.tabs.toArray()[1].active).toBe(true);
  });

  describe('onResize / onScroll (direct calls)', () => {
    function setTabsListSizes(props: {
      offsetWidth?: number;
      scrollWidth?: number;
      scrollLeft?: number;
      clientWidth?: number;
    }) {
      const el = component.tabsList.nativeElement;
      el.style.padding = '0';
      el.style.borderWidth = '0';
      Object.entries(props).forEach(([key, value]) => {
        if (key === 'scrollLeft') {
          el.scrollLeft = value;
        } else {
          Object.defineProperty(el, key, { value, configurable: true });
        }
      });
    }

    it('should update nav button visibility on scroll', () => {
      setTabsListSizes({
        offsetWidth: 200,
        scrollWidth: 500,
        scrollLeft: 50,
        clientWidth: 200
      });
      component.onScroll();
      expect(component.backBtnVisible).toBe(false);
    });

    it('should update nav button visibility on resize', () => {
      setTabsListSizes({
        offsetWidth: 0,
        scrollWidth: 0,
        scrollLeft: 0,
        clientWidth: 0
      });
      component.onResize();
      expect(component.backBtnVisible).toBe(true);
      expect(component.forwardBtnVisible).toBe(true);
    });

    it('should react to a real window resize event', fakeAsync(() => {
      const spy = jest.spyOn(component, 'onResize');
      window.dispatchEvent(new Event('resize'));
      tick(60);
      expect(spy).toHaveBeenCalled();
    }));
  });

  describe('navBackward / navForward', () => {
    function setTabsListSizes(props: {
      offsetWidth?: number;
      scrollWidth?: number;
      scrollLeft?: number;
      clientWidth?: number;
    }) {
      const el = component.tabsList.nativeElement;
      el.style.padding = '0';
      el.style.borderWidth = '0';
      Object.entries(props).forEach(([key, value]) => {
        if (key === 'scrollLeft') {
          el.scrollLeft = value;
        } else {
          Object.defineProperty(el, key, { value, configurable: true });
        }
      });
    }

    it('should clamp scrollLeft to 0 when navigating backward past the start', () => {
      setTabsListSizes({
        offsetWidth: 300,
        scrollWidth: 600,
        scrollLeft: 10,
        clientWidth: 300
      });
      component.navBackward();
      expect(component.tabsList.nativeElement.scrollLeft).toBe(0);
    });

    it('should scroll backward by the visible width', () => {
      setTabsListSizes({
        offsetWidth: 300,
        scrollWidth: 900,
        scrollLeft: 400,
        clientWidth: 300
      });
      component.navBackward();
      expect(component.tabsList.nativeElement.scrollLeft).toBe(100);
    });

    it('should clamp scrollLeft to the last position when navigating forward past the end', () => {
      setTabsListSizes({
        offsetWidth: 300,
        scrollWidth: 400,
        scrollLeft: 350,
        clientWidth: 300
      });
      component.navForward();
      expect(component.tabsList.nativeElement.scrollLeft).toBe(100);
    });

    it('should scroll forward by the visible width', () => {
      setTabsListSizes({
        offsetWidth: 300,
        scrollWidth: 900,
        scrollLeft: 0,
        clientWidth: 300
      });
      component.navForward();
      expect(component.tabsList.nativeElement.scrollLeft).toBe(300);
    });

    it('should account for visible nav button widths when both are shown', () => {
      component.backBtnVisible = false;
      component.forwardBtnVisible = false;
      hostFixture.detectChanges();

      expect(component.backBtn).toBeTruthy();
      expect(component.forwardBtn).toBeTruthy();
      Object.defineProperty(component.backBtn!.nativeElement, 'offsetWidth', {
        value: 20,
        configurable: true
      });
      Object.defineProperty(
        component.forwardBtn!.nativeElement,
        'offsetWidth',
        { value: 20, configurable: true }
      );
      setTabsListSizes({
        offsetWidth: 300,
        scrollWidth: 900,
        scrollLeft: 0,
        clientWidth: 300
      });
      expect(() => component.navForward()).not.toThrow();
    });
  });

  describe('_scrollTabIntoView', () => {
    it('should scroll left when the target tab starts before the visible area', () => {
      const tabEls = getTabEls(hostFixture);
      const list = component.tabsList.nativeElement;
      list.scrollLeft = 100;
      Object.defineProperty(tabEls[0], 'offsetLeft', {
        value: 10,
        configurable: true
      });
      Object.defineProperty(tabEls[0], 'offsetWidth', {
        value: 50,
        configurable: true
      });
      (component as any)._scrollTabIntoView(tabEls[0]);
      expect(list.scrollLeft).toBe(10);
    });

    it('should scroll right when the target tab ends after the visible area', () => {
      const tabEls = getTabEls(hostFixture);
      const list = component.tabsList.nativeElement;
      Object.defineProperty(list, 'clientWidth', {
        value: 100,
        configurable: true
      });
      list.scrollLeft = 0;
      Object.defineProperty(tabEls[3], 'offsetLeft', {
        value: 500,
        configurable: true
      });
      Object.defineProperty(tabEls[3], 'offsetWidth', {
        value: 50,
        configurable: true
      });
      (component as any)._scrollTabIntoView(tabEls[3]);
      expect(list.scrollLeft).toBe(450);
    });
  });

  describe('Home / End with all tabs disabled', () => {
    beforeEach(() => {
      component.tabs.toArray().forEach((t) => (t.disabled = true));
      hostFixture.detectChanges();
    });

    it('should not navigate on Home when every tab is disabled', () => {
      const tabEls = getTabEls(hostFixture);
      expect(() => dispatchKeydown(tabEls[0], 'Home')).not.toThrow();
    });

    it('should not navigate on End when every tab is disabled', () => {
      const tabEls = getTabEls(hostFixture);
      expect(() => dispatchKeydown(tabEls[0], 'End')).not.toThrow();
    });
  });

  describe('_nextEnabledTab backward wrap skipping a disabled tab', () => {
    it('should skip a disabled tab while wrapping backward past the start', () => {
      const tabs = component.tabs.toArray();
      tabs[3].disabled = true;
      hostFixture.detectChanges();
      const result = (component as any)._nextEnabledTab(0, -1, tabs);
      expect(result).toBe(1);
    });
  });

  describe('selectTab with out-of-range tab indexes', () => {
    it('should skip deactivating the previous tab when its index is out of range', () => {
      component.selectedIndex = 1;
      hostFixture.detectChanges();
      (component as any)._previousTabIndex = 99;
      expect(() => component.selectTab()).not.toThrow();
    });

    it('should skip activating the new tab when its index is out of range', () => {
      (component as any)._currentTabIndex = 99;
      (component as any)._previousTabIndex = 0;
      expect(() => component.selectTab()).not.toThrow();
    });
  });

  describe('selectTab with an unrecognized animationType', () => {
    it('should not set an animation state for an unknown animationType', () => {
      component.animationType = 'unknown' as any;
      component.animationState = 'fadeIn';
      component.selectedIndex = 1;
      component.selectTab();
      expect(component.animationState).toBe('fadeIn');
    });
  });

  describe('selectTab with fade animation and silent=true', () => {
    it('should not emit afterTabChanged after the fade timeout when silent', fakeAsync(() => {
      host.animationType = 'fade';
      hostFixture.detectChanges();
      jest.spyOn(component.afterTabChanged, 'emit');
      component.selectedIndex = 1;
      component.selectTab(true);
      tick(100);
      expect(component.afterTabChanged.emit).not.toHaveBeenCalled();
    }));
  });

  describe('reduced motion', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should use the default transition durations by default', () => {
      jest
        .spyOn(window, 'matchMedia')
        .mockReturnValue({ matches: false } as MediaQueryList);

      expect(component.resolvedTransitionParams).toBe('200ms ease-in');
      expect(component.resolvedFadeTransitionParams).toBe('100ms ease-in');
    });

    it('should use a near-instant transition when the OS prefers reduced motion', () => {
      jest
        .spyOn(window, 'matchMedia')
        .mockReturnValue({ matches: true } as MediaQueryList);

      expect(component.resolvedTransitionParams).toBe('1ms');
      expect(component.resolvedFadeTransitionParams).toBe('1ms');
    });
  });
});
