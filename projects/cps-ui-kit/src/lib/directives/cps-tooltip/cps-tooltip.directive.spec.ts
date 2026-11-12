import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick
} from '@angular/core/testing';
import {
  CpsTooltipDirective,
  CpsTooltipPosition
} from './cps-tooltip.directive';
import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID
} from '@angular/core';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { CPS_ROOT_FONT_SIZE_SERVICE } from '../../services/cps-root-font-size/cps-root-font-size.service';
import { CPS_LIVE_ANNOUNCER_SERVICE } from '../../services/cps-live-announcer/cps-live-announcer.service';
import { CpsNotificationService } from '../../services/cps-notification/cps-notification.service';
import { markOverlayShown } from '../../utils/internal/overlay-utils/overlay-utils';
import { ZIndexUtils } from '../../primeng-temp/utils/public_api';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<div cpsTooltip="<style onload='alert(420);'></style>"></div>`,
  imports: [CpsTooltipDirective]
})
class MaliciousTooltipComponent {}
const mockRootFontSizeService = {
  fontSize: () => 16
};
const mockLiveAnnouncer = {
  announce: jest.fn()
};

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<div cpsTooltip="<h1>Legit tooltip</h1>"></div>`,
  imports: [CpsTooltipDirective]
})
class LegitTooltipComponent {}

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<div
    cpsTooltip="Tooltip text"
    [tooltipOpenOn]="openOn"
    [tooltipPosition]="position"
    [tooltipPersistent]="persistent"
    [tooltipDisabled]="disabled"
    [tooltipOffset]="offset"></div>`,
  imports: [CpsTooltipDirective]
})
class ConfigurableTooltipComponent {
  openOn: 'hover' | 'click' | 'focus' = 'hover';
  position: CpsTooltipPosition = 'top';
  persistent = false;
  disabled = false;
  offset: number | string = '0.5rem';
}

describe('CpsTooltipDirective', () => {
  let legitComponent: LegitTooltipComponent;
  let legitComponentFixture: ComponentFixture<LegitTooltipComponent>;

  let maliciousComponent: MaliciousTooltipComponent;
  let maliciousComponentFixture: ComponentFixture<MaliciousTooltipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [],
      providers: [
        {
          provide: CPS_ROOT_FONT_SIZE_SERVICE,
          useValue: mockRootFontSizeService
        },
        {
          provide: CPS_LIVE_ANNOUNCER_SERVICE,
          useValue: mockLiveAnnouncer
        },
        provideNoopAnimations()
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    mockLiveAnnouncer.announce.mockClear();
    legitComponentFixture = TestBed.createComponent(LegitTooltipComponent);
    legitComponent = legitComponentFixture.componentInstance;
    legitComponentFixture.detectChanges();

    maliciousComponentFixture = TestBed.createComponent(
      MaliciousTooltipComponent
    );
    maliciousComponent = maliciousComponentFixture.componentInstance;
    maliciousComponentFixture.detectChanges();
  });

  it('should create the component', () => {
    expect(maliciousComponent).toBeTruthy();
    expect(legitComponent).toBeTruthy();
  });

  it('should sanitize the malicious tooltip content', fakeAsync(() => {
    const consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    const divElement = maliciousComponentFixture.debugElement.query(
      By.css('div')
    );
    divElement.triggerEventHandler('mouseenter', null);
    maliciousComponentFixture.detectChanges();

    tick(300);

    const tooltipElement: HTMLElement | null =
      document.body.querySelector('.cps-tooltip');

    expect(tooltipElement).toBeTruthy();
    const content = tooltipElement?.querySelector(
      '[data-testid="cps-tooltip-content"]'
    );
    expect(content).toBeTruthy();
    expect(content?.textContent).toBe('Add your text to this tooltip');
    // Angular informs about stripping some content during sanitization
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('sanitizing HTML stripped some content')
    );

    divElement.triggerEventHandler('mouseleave', null);
    maliciousComponentFixture.detectChanges();

    tick(500);

    expect(document.body.querySelector('.cps-tooltip')).toBeFalsy();
  }));

  it('should properly show legit tooltip', fakeAsync(() => {
    const divElement = legitComponentFixture.debugElement.query(By.css('div'));
    divElement.triggerEventHandler('mouseenter', null);
    legitComponentFixture.detectChanges();

    tick(300);

    const tooltipElement: HTMLElement | null =
      document.body.querySelector('.cps-tooltip');

    expect(tooltipElement).toBeTruthy();
    const content = tooltipElement?.querySelector(
      '[data-testid="cps-tooltip-content"]'
    );
    expect(content).toBeTruthy();
    expect(content?.querySelector('h1')?.textContent).toBe('Legit tooltip');

    divElement.triggerEventHandler('mouseleave', null);
    legitComponentFixture.detectChanges();

    tick(500);

    expect(document.body.querySelector('.cps-tooltip')).toBeFalsy();
  }));

  describe('configurable behavior', () => {
    let fixture: ComponentFixture<ConfigurableTooltipComponent>;
    let component: ConfigurableTooltipComponent;
    let divElement: ReturnType<
      ComponentFixture<ConfigurableTooltipComponent>['debugElement']['query']
    >;
    let directive: CpsTooltipDirective;

    beforeEach(() => {
      fixture = TestBed.createComponent(ConfigurableTooltipComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      divElement = fixture.debugElement.query(By.css('div'));
      directive = fixture.debugElement
        .query(By.directive(CpsTooltipDirective))
        .injector.get(CpsTooltipDirective);
    });

    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;
    const originalActiveElementDescriptor = Object.getOwnPropertyDescriptor(
      Document.prototype,
      'activeElement'
    );

    afterEach(() => {
      document.querySelectorAll('.cps-tooltip').forEach((el) => el.remove());
      Object.defineProperty(window, 'innerWidth', {
        value: originalInnerWidth,
        configurable: true
      });
      Object.defineProperty(window, 'innerHeight', {
        value: originalInnerHeight,
        configurable: true
      });
      Object.defineProperty(
        document,
        'activeElement',
        originalActiveElementDescriptor as PropertyDescriptor
      );
    });

    it('should not open on mouseenter when tooltipOpenOn is not hover', fakeAsync(() => {
      component.openOn = 'click';
      fixture.detectChanges();
      divElement.triggerEventHandler('mouseenter', null);
      tick(300);
      expect(document.body.querySelector('.cps-tooltip')).toBeFalsy();
    }));

    it('should not create a tooltip when disabled', fakeAsync(() => {
      component.disabled = true;
      fixture.detectChanges();
      divElement.triggerEventHandler('mouseenter', null);
      tick(300);
      expect(document.body.querySelector('.cps-tooltip')).toBeFalsy();
    }));

    it('should keep the tooltip open on mouseleave when persistent', fakeAsync(() => {
      component.persistent = true;
      fixture.detectChanges();
      divElement.triggerEventHandler('mouseenter', null);
      tick(300);
      expect(document.body.querySelector('.cps-tooltip')).toBeTruthy();

      divElement.triggerEventHandler('mouseleave', null);
      tick(500);
      expect(document.body.querySelector('.cps-tooltip')).toBeTruthy();
    }));

    it('should open on focus when tooltipOpenOn is focus and target is focus-visible', fakeAsync(() => {
      component.openOn = 'focus';
      fixture.detectChanges();
      jest.spyOn(divElement.nativeElement, 'matches').mockReturnValue(true);
      Object.defineProperty(document, 'activeElement', {
        value: divElement.nativeElement,
        configurable: true
      });

      divElement.triggerEventHandler('focusin', null);
      tick(300);

      expect(document.body.querySelector('.cps-tooltip')).toBeTruthy();
    }));

    it('should not open on focus when the element is not focus-visible', fakeAsync(() => {
      component.openOn = 'focus';
      fixture.detectChanges();
      jest.spyOn(divElement.nativeElement, 'matches').mockReturnValue(false);
      Object.defineProperty(document, 'activeElement', {
        value: divElement.nativeElement,
        configurable: true
      });

      divElement.triggerEventHandler('focusin', null);
      tick(300);

      expect(document.body.querySelector('.cps-tooltip')).toBeFalsy();
    }));

    it('should not open on focus when tooltipOpenOn is click', fakeAsync(() => {
      component.openOn = 'click';
      fixture.detectChanges();
      divElement.triggerEventHandler('focusin', null);
      tick(300);
      expect(document.body.querySelector('.cps-tooltip')).toBeFalsy();
    }));

    it('should schedule hide on focusout when relatedTarget is outside the popup', fakeAsync(() => {
      component.openOn = 'click';
      fixture.detectChanges();
      divElement.triggerEventHandler('click', null);
      tick();

      const outside = document.createElement('div');
      divElement.triggerEventHandler('focusout', { relatedTarget: outside });
      tick(500);

      expect(document.body.querySelector('.cps-tooltip')).toBeFalsy();
    }));

    it('should not schedule hide on focusout when relatedTarget is inside the popup', fakeAsync(() => {
      component.openOn = 'click';
      fixture.detectChanges();
      divElement.triggerEventHandler('click', null);
      tick();

      const popup = document.body.querySelector('.cps-tooltip') as HTMLElement;
      divElement.triggerEventHandler('focusout', {
        relatedTarget: popup.firstElementChild
      });
      tick(300);

      expect(document.body.querySelector('.cps-tooltip')).toBeTruthy();
    }));

    it('should open on click when tooltipOpenOn is click', fakeAsync(() => {
      component.openOn = 'click';
      fixture.detectChanges();
      divElement.triggerEventHandler('click', null);
      tick();
      expect(document.body.querySelector('.cps-tooltip')).toBeTruthy();
      expect(mockLiveAnnouncer.announce).toHaveBeenCalledWith(
        'Tooltip text',
        'assertive',
        1000,
        100
      );
    }));

    it('should not open on click when tooltipOpenOn is hover', fakeAsync(() => {
      divElement.triggerEventHandler('click', null);
      tick();
      expect(document.body.querySelector('.cps-tooltip')).toBeFalsy();
    }));

    it('should destroy on document click outside when persistent', fakeAsync(() => {
      component.openOn = 'click';
      component.persistent = true;
      fixture.detectChanges();
      divElement.triggerEventHandler('click', null);
      tick();
      expect(document.body.querySelector('.cps-tooltip')).toBeTruthy();

      const outside = document.createElement('div');
      document.body.appendChild(outside);
      directive.onDocumentClick(outside);
      tick(200);

      expect(document.body.querySelector('.cps-tooltip')).toBeFalsy();
      outside.remove();
    }));

    it('should not destroy on document click inside the trigger when persistent', fakeAsync(() => {
      component.openOn = 'click';
      component.persistent = true;
      fixture.detectChanges();
      divElement.triggerEventHandler('click', null);
      tick();

      directive.onDocumentClick(divElement.nativeElement);
      tick();

      expect(document.body.querySelector('.cps-tooltip')).toBeTruthy();
    }));

    it('should do nothing on document click when the target is not connected', fakeAsync(() => {
      component.openOn = 'click';
      component.persistent = true;
      fixture.detectChanges();
      divElement.triggerEventHandler('click', null);
      tick();

      const detached = document.createElement('div');
      directive.onDocumentClick(detached);
      tick(200);

      expect(document.body.querySelector('.cps-tooltip')).toBeTruthy();
    }));

    it('should do nothing on document click when not persistent', fakeAsync(() => {
      component.openOn = 'click';
      fixture.detectChanges();
      divElement.triggerEventHandler('click', null);
      tick();

      const outside = document.createElement('div');
      document.body.appendChild(outside);
      expect(() => directive.onDocumentClick(outside)).not.toThrow();
      tick(200);
      expect(document.body.querySelector('.cps-tooltip')).toBeTruthy();
      outside.remove();
    }));

    it('should destroy immediately on page resize', fakeAsync(() => {
      divElement.triggerEventHandler('mouseenter', null);
      tick(300);
      expect(document.body.querySelector('.cps-tooltip')).toBeTruthy();

      directive.onPageResize();

      expect(document.body.querySelector('.cps-tooltip')).toBeFalsy();
    }));

    it('should destroy immediately on window scroll while open', fakeAsync(() => {
      divElement.triggerEventHandler('mouseenter', null);
      tick(300);
      expect(document.body.querySelector('.cps-tooltip')).toBeTruthy();
      tick(16);

      window.dispatchEvent(new Event('scroll'));

      expect(document.body.querySelector('.cps-tooltip')).toBeFalsy();
    }));

    it('should position for bottom/left/right when explicitly configured', fakeAsync(() => {
      for (const pos of ['bottom', 'left', 'right', 'top'] as const) {
        component.position = pos;
        fixture.detectChanges();
        divElement.triggerEventHandler('mouseenter', null);
        tick(300);
        expect(document.body.querySelector('.cps-tooltip')).toBeTruthy();
        directive.onPageResize();
        tick();
      }
    }));

    it('should log an error and skip showing when no position fits on screen', fakeAsync(() => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      Object.defineProperty(window, 'innerWidth', {
        value: 0,
        configurable: true
      });
      Object.defineProperty(window, 'innerHeight', {
        value: 0,
        configurable: true
      });

      divElement.triggerEventHandler('mouseenter', null);
      tick(500);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Not enough space on the screen for the tooltip!'
      );
      expect(document.body.querySelector('.cps-tooltip')).toBeFalsy();
    }));

    it('should not throw when destroying without an existing popup', () => {
      expect(() => (directive as any)._destroyTooltip()).not.toThrow();
    });

    it('should not throw when positioning without an existing popup', () => {
      expect(() => (directive as any)._positionAndShow()).not.toThrow();
    });

    it('should return undefined coords when there is no popup', () => {
      expect((directive as any)._getCoords()).toBeUndefined();
    });

    it('should be a no-op to create a tooltip twice in a row', fakeAsync(() => {
      divElement.triggerEventHandler('mouseenter', null);
      tick(300);
      const popup = document.body.querySelector('.cps-tooltip');
      (directive as any)._createTooltip();
      expect(document.body.querySelectorAll('.cps-tooltip').length).toBe(1);
      expect(document.body.querySelector('.cps-tooltip')).toBe(popup);
    }));

    it('should ignore non-Tab keydown on the popup', fakeAsync(() => {
      component.persistent = true;
      fixture.detectChanges();
      divElement.triggerEventHandler('mouseenter', null);
      tick(300);
      const popup = document.body.querySelector('.cps-tooltip') as HTMLElement;
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      expect(() => popup.dispatchEvent(event)).not.toThrow();
    }));

    it('should ignore Tab keydown on the popup when there are no focusable elements', fakeAsync(() => {
      component.persistent = true;
      fixture.detectChanges();
      divElement.triggerEventHandler('mouseenter', null);
      tick(300);
      const popup = document.body.querySelector('.cps-tooltip') as HTMLElement;
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      expect(() => popup.dispatchEvent(event)).not.toThrow();
    }));

    describe('_onPopupKeydown focus wrapping', () => {
      function makeFocusable(): HTMLElement {
        const el = document.createElement('div');
        el.tabIndex = 0;
        Object.defineProperty(el, 'offsetWidth', {
          value: 10,
          configurable: true
        });
        return el;
      }

      it('should focus the ariaTarget when tabbing forward past the last focusable element', fakeAsync(() => {
        component.persistent = true;
        fixture.detectChanges();
        divElement.triggerEventHandler('mouseenter', null);
        tick(300);
        const popup = document.body.querySelector(
          '.cps-tooltip'
        ) as HTMLElement;
        const first = makeFocusable();
        const last = makeFocusable();
        popup.appendChild(first);
        popup.appendChild(last);
        last.focus();

        const ariaTarget = document.createElement('button');
        const focusSpy = jest.spyOn(ariaTarget, 'focus');
        (directive as any)._ariaTarget = ariaTarget;

        (directive as any)._onPopupKeydown({
          key: 'Tab',
          shiftKey: false,
          preventDefault: jest.fn()
        });

        expect(focusSpy).toHaveBeenCalled();
        last.remove();
      }));

      it('should preventDefault and focus the ariaTarget when shift-tabbing past the first focusable element', fakeAsync(() => {
        component.persistent = true;
        fixture.detectChanges();
        divElement.triggerEventHandler('mouseenter', null);
        tick(300);
        const popup = document.body.querySelector(
          '.cps-tooltip'
        ) as HTMLElement;
        const first = makeFocusable();
        const last = makeFocusable();
        popup.appendChild(first);
        popup.appendChild(last);
        first.focus();

        const ariaTarget = document.createElement('button');
        const focusSpy = jest.spyOn(ariaTarget, 'focus');
        (directive as any)._ariaTarget = ariaTarget;
        const preventDefault = jest.fn();

        (directive as any)._onPopupKeydown({
          key: 'Tab',
          shiftKey: true,
          preventDefault
        });

        expect(preventDefault).toHaveBeenCalled();
        expect(focusSpy).toHaveBeenCalled();
        first.remove();
      }));

      it('should do nothing when the active element is neither the first nor the last focusable element', fakeAsync(() => {
        component.persistent = true;
        fixture.detectChanges();
        divElement.triggerEventHandler('mouseenter', null);
        tick(300);
        const popup = document.body.querySelector(
          '.cps-tooltip'
        ) as HTMLElement;
        const first = makeFocusable();
        const middle = makeFocusable();
        const last = makeFocusable();
        popup.appendChild(first);
        popup.appendChild(middle);
        popup.appendChild(last);
        middle.focus();

        const ariaTarget = document.createElement('button');
        const focusSpy = jest.spyOn(ariaTarget, 'focus');
        (directive as any)._ariaTarget = ariaTarget;

        (directive as any)._onPopupKeydown({
          key: 'Tab',
          shiftKey: false,
          preventDefault: jest.fn()
        });

        expect(focusSpy).not.toHaveBeenCalled();
        middle.remove();
      }));

      it('should shift-tab back to the target of a tooltip opened on hover, which has no aria target', fakeAsync(() => {
        component.persistent = true;
        fixture.detectChanges();
        divElement.triggerEventHandler('mouseenter', null);
        tick(300);
        const first = makeFocusable();
        getPopup().appendChild(first);
        first.focus();
        const inner = appendFocusable(divElement.nativeElement);
        const preventDefault = jest.fn();

        (directive as any)._onPopupKeydown({
          key: 'Tab',
          shiftKey: true,
          preventDefault
        });

        expect(preventDefault).toHaveBeenCalled();
        expect(document.activeElement).toBe(inner);
      }));
    });

    describe('_onPopupFocusOut', () => {
      it('should schedule hide when the new focus is outside both the popup and the trigger', fakeAsync(() => {
        component.persistent = true;
        fixture.detectChanges();
        divElement.triggerEventHandler('mouseenter', null);
        tick(300);
        expect(document.body.querySelector('.cps-tooltip')).toBeTruthy();

        const outside = document.createElement('div');
        (directive as any)._onPopupFocusOut({ relatedTarget: outside });
        tick(500);

        expect(document.body.querySelector('.cps-tooltip')).toBeFalsy();
      }));

      it('should not schedule hide when the new focus moves to the trigger element', fakeAsync(() => {
        component.persistent = true;
        fixture.detectChanges();
        divElement.triggerEventHandler('mouseenter', null);
        tick(300);

        (directive as any)._onPopupFocusOut({
          relatedTarget: divElement.nativeElement
        });
        tick(500);

        expect(document.body.querySelector('.cps-tooltip')).toBeTruthy();
      }));
    });

    function getPopup(): HTMLElement {
      return document.body.querySelector('.cps-tooltip') as HTMLElement;
    }

    function appendFocusable(parent: HTMLElement): HTMLButtonElement {
      const button = document.createElement('button');
      Object.defineProperty(button, 'offsetWidth', {
        value: 10,
        configurable: true
      });
      jest.spyOn(button, 'matches').mockReturnValue(true);
      parent.appendChild(button);
      return button;
    }

    function keyboardFocusTarget(): void {
      jest.spyOn(divElement.nativeElement, 'matches').mockReturnValue(true);
      Object.defineProperty(document, 'activeElement', {
        value: divElement.nativeElement,
        configurable: true
      });
      divElement.triggerEventHandler('focusin', null);
    }

    function focusLinkInPopup(): HTMLAnchorElement {
      const link = document.createElement('a');
      link.href = '#';
      getPopup().appendChild(link);
      link.focus();
      return link;
    }

    describe('Esc dismissal', () => {
      function pressKey(
        key: string,
        target: EventTarget = document.body
      ): KeyboardEvent {
        const event = new KeyboardEvent('keydown', {
          key,
          bubbles: true,
          cancelable: true
        });
        target.dispatchEvent(event);
        return event;
      }

      it('should close a visible tooltip and keep the Esc from reaching the window', fakeAsync(() => {
        const windowListener = jest.fn();
        window.addEventListener('keydown', windowListener);
        try {
          divElement.triggerEventHandler('mouseenter', null);
          tick(300);
          expect(document.body.querySelector('.cps-tooltip')).toBeTruthy();

          const event = pressKey('Escape');
          tick(200);

          expect(event.defaultPrevented).toBe(true);
          expect(windowListener).not.toHaveBeenCalled();
          expect(document.body.querySelector('.cps-tooltip')).toBeFalsy();
        } finally {
          window.removeEventListener('keydown', windowListener);
        }
      }));

      it('should cancel a focus tooltip still waiting to show, without handling the Esc', fakeAsync(() => {
        component.openOn = 'focus';
        fixture.detectChanges();
        keyboardFocusTarget();
        expect(document.body.querySelector('.cps-tooltip')).toBeTruthy();

        const event = pressKey('Escape');

        expect(event.defaultPrevented).toBe(false);
        expect(document.body.querySelector('.cps-tooltip')).toBeFalsy();
        tick(300);
        expect(document.body.querySelector('.cps-tooltip')).toBeFalsy();
      }));

      it('should cancel a hover tooltip still waiting to show, without handling the Esc', fakeAsync(() => {
        divElement.triggerEventHandler('mouseenter', null);
        tick(100);

        const event = pressKey('Escape');
        tick(300);

        expect(event.defaultPrevented).toBe(false);
        expect(document.body.querySelector('.cps-tooltip')).toBeFalsy();
      }));

      it('should stay closed after Esc when the pointer crossed a keyboard-focused target more than once', fakeAsync(() => {
        keyboardFocusTarget();
        tick(300);
        divElement.triggerEventHandler('mouseenter', null);
        divElement.triggerEventHandler('mouseleave', null);
        divElement.triggerEventHandler('mouseenter', null);

        pressKey('Escape');
        tick(500);

        expect(document.body.querySelector('.cps-tooltip')).toBeFalsy();
      }));

      it('should ignore other keys', fakeAsync(() => {
        divElement.triggerEventHandler('mouseenter', null);
        tick(300);

        const event = pressKey('Enter');
        tick(200);

        expect(event.defaultPrevented).toBe(false);
        expect(document.body.querySelector('.cps-tooltip')).toBeTruthy();
      }));

      it('should stop handling Esc once the tooltip is closed', fakeAsync(() => {
        divElement.triggerEventHandler('mouseenter', null);
        tick(300);
        divElement.triggerEventHandler('mouseleave', null);
        tick(500);
        expect(document.body.querySelector('.cps-tooltip')).toBeFalsy();

        expect(pressKey('Escape').defaultPrevented).toBe(false);
      }));

      it('should send focus back to the target without reopening when it was inside the tooltip', fakeAsync(() => {
        component.persistent = true;
        fixture.detectChanges();
        divElement.triggerEventHandler('mouseenter', null);
        tick(300);
        const link = focusLinkInPopup();
        const inner = appendFocusable(divElement.nativeElement);

        pressKey('Escape', link);
        tick(500);

        expect(document.activeElement).toBe(inner);
        expect(document.body.querySelector('.cps-tooltip')).toBeFalsy();
      }));

      it('should not describe or return focus to an element outside the target after a click that does not focus', fakeAsync(() => {
        component.openOn = 'click';
        component.persistent = true;
        fixture.detectChanges();
        const inner = appendFocusable(divElement.nativeElement);
        const outside = appendFocusable(document.body);
        try {
          outside.focus();
          divElement.triggerEventHandler('click', null);
          tick();
          expect(outside.hasAttribute('aria-description')).toBe(false);
          const link = focusLinkInPopup();

          pressKey('Escape', link);
          tick(500);

          expect(document.activeElement).toBe(inner);
        } finally {
          outside.remove();
        }
      }));

      it('should send focus to the target itself before its focusable content, even with tabindex -1', fakeAsync(() => {
        component.persistent = true;
        fixture.detectChanges();
        const target = divElement.nativeElement as HTMLElement;
        target.setAttribute('tabindex', '-1');
        appendFocusable(target);
        divElement.triggerEventHandler('mouseenter', null);
        tick(300);
        const link = focusLinkInPopup();

        pressKey('Escape', link);
        tick(500);

        expect(document.activeElement).toBe(target);
        expect(document.body.querySelector('.cps-tooltip')).toBeFalsy();
      }));

      it('should leave the Esc to a menu, dialog or notification opened after the tooltip', fakeAsync(() => {
        divElement.triggerEventHandler('mouseenter', null);
        tick(300);
        const overlay = document.createElement('div');
        ZIndexUtils.set('overlay', overlay, 1000);
        try {
          const event = pressKey('Escape');
          tick(200);

          expect(event.defaultPrevented).toBe(false);
          expect(document.body.querySelector('.cps-tooltip')).toBeTruthy();
        } finally {
          ZIndexUtils.clear(overlay);
        }
      }));

      it('should take the Esc over a menu, dialog or notification that was open before it', fakeAsync(() => {
        const overlay = document.createElement('div');
        ZIndexUtils.set('overlay', overlay, 1000);
        try {
          divElement.triggerEventHandler('mouseenter', null);
          tick(300);

          const event = pressKey('Escape');
          tick(200);

          expect(event.defaultPrevented).toBe(true);
          expect(document.body.querySelector('.cps-tooltip')).toBeFalsy();
        } finally {
          ZIndexUtils.clear(overlay);
        }
      }));

      it('should take the Esc over an overlay open before it that gets a lower z-index while open', fakeAsync(() => {
        const below = document.body.appendChild(document.createElement('div'));
        const overlay = document.body.appendChild(
          document.createElement('div')
        );
        ZIndexUtils.set('modal', below, 1100);
        ZIndexUtils.set('overlay', overlay, 1000);
        try {
          divElement.triggerEventHandler('mouseenter', null);
          tick(300);
          const zIndex = ZIndexUtils.get(overlay);
          ZIndexUtils.clear(below);
          ZIndexUtils.clear(overlay);
          ZIndexUtils.set('overlay', overlay, 1000);
          expect(ZIndexUtils.get(overlay)).toBeLessThan(zIndex);

          const event = pressKey('Escape');
          tick(200);

          expect(event.defaultPrevented).toBe(true);
          expect(document.body.querySelector('.cps-tooltip')).toBeFalsy();
        } finally {
          ZIndexUtils.clear(below);
          ZIndexUtils.clear(overlay);
          below.remove();
          overlay.remove();
        }
      }));

      it('should leave the Esc to an overlay opened after the tooltip with the z-index of one closed since', fakeAsync(() => {
        const closed = document.body.appendChild(document.createElement('div'));
        const opened = document.body.appendChild(document.createElement('div'));
        ZIndexUtils.set('overlay', closed, 1000);
        try {
          divElement.triggerEventHandler('mouseenter', null);
          tick(300);
          const zIndex = ZIndexUtils.get(closed);
          ZIndexUtils.clear(closed);
          ZIndexUtils.set('overlay', opened, 1000);
          expect(ZIndexUtils.get(opened)).toBe(zIndex);

          const event = pressKey('Escape');
          tick(200);

          expect(event.defaultPrevented).toBe(false);
          expect(document.body.querySelector('.cps-tooltip')).toBeTruthy();
        } finally {
          ZIndexUtils.clear(closed);
          ZIndexUtils.clear(opened);
          closed.remove();
          opened.remove();
        }
      }));

      it('should leave the Esc to an overlay opened after the tooltip at a z-index another element also has inline', fakeAsync(() => {
        const closed = document.body.appendChild(document.createElement('div'));
        const opened = document.body.appendChild(document.createElement('div'));
        const header = document.body.appendChild(document.createElement('div'));
        ZIndexUtils.set('overlay', closed, 1000);
        header.style.zIndex = closed.style.zIndex;
        try {
          divElement.triggerEventHandler('mouseenter', null);
          tick(300);
          ZIndexUtils.clear(closed);
          ZIndexUtils.set('overlay', opened, 1000);
          expect(ZIndexUtils.get(opened)).toBe(ZIndexUtils.get(header));

          const event = pressKey('Escape');
          tick(200);

          expect(event.defaultPrevented).toBe(false);
          expect(document.body.querySelector('.cps-tooltip')).toBeTruthy();
        } finally {
          ZIndexUtils.clear(closed);
          ZIndexUtils.clear(opened);
          closed.remove();
          opened.remove();
          header.remove();
        }
      }));

      it('should leave the Esc to an overlay open before the tooltip that showed something new since', fakeAsync(() => {
        const overlay = document.body.appendChild(
          document.createElement('div')
        );
        ZIndexUtils.set('modal', overlay, 1100);
        try {
          divElement.triggerEventHandler('mouseenter', null);
          tick(300);
          markOverlayShown(overlay);

          const event = pressKey('Escape');
          tick(200);

          expect(event.defaultPrevented).toBe(false);
          expect(document.body.querySelector('.cps-tooltip')).toBeTruthy();
        } finally {
          ZIndexUtils.clear(overlay);
          overlay.remove();
        }
      }));

      it('should leave the Esc to a notification added after the tooltip to a container already open', fakeAsync(() => {
        const notifications = TestBed.inject(CpsNotificationService);
        const appRef = TestBed.inject(ApplicationRef);
        const show = (message: string) => {
          notifications.info(message, undefined, { timeout: 0 });
          appRef.tick();
          tick();
        };
        try {
          show('Saved');
          divElement.triggerEventHandler('mouseenter', null);
          tick(300);
          show('Saved again');
          expect(
            document.querySelectorAll('cps-notification-container')
          ).toHaveLength(1);

          const event = pressKey('Escape');
          tick(200);

          // Handled by the notifications, the tooltip stays open
          expect(event.defaultPrevented).toBe(true);
          expect(document.body.querySelector('.cps-tooltip')).toBeTruthy();
        } finally {
          notifications.clear();
        }
      }));

      it('should let clicks through the tooltip while it fades out', fakeAsync(() => {
        divElement.triggerEventHandler('mouseenter', null);
        tick(300);
        const popup = getPopup();

        pressKey('Escape');

        expect(popup.style.pointerEvents).toBe('none');
        tick(200);
      }));
    });

    describe('hovering the tooltip', () => {
      function rect(
        left: number,
        top: number,
        right: number,
        bottom: number
      ): DOMRect {
        return {
          left,
          top,
          right,
          bottom,
          x: left,
          y: top,
          width: right - left,
          height: bottom - top
        } as DOMRect;
      }

      it('should stay open while the pointer is on the tooltip and close after it leaves', fakeAsync(() => {
        divElement.triggerEventHandler('mouseenter', null);
        tick(300);
        const popup = getPopup();

        divElement.triggerEventHandler('mouseleave', null);
        popup.dispatchEvent(new MouseEvent('mouseenter'));
        tick(500);
        expect(document.body.querySelector('.cps-tooltip')).toBeTruthy();

        popup.dispatchEvent(new MouseEvent('mouseleave'));
        tick(500);
        expect(document.body.querySelector('.cps-tooltip')).toBeFalsy();
      }));

      it('should keep a focus-opened tooltip open when the pointer only passes over it', fakeAsync(() => {
        keyboardFocusTarget();
        tick(300);
        const popup = getPopup();

        popup.dispatchEvent(new MouseEvent('mouseenter'));
        popup.dispatchEvent(new MouseEvent('mouseleave'));
        tick(500);

        expect(document.body.querySelector('.cps-tooltip')).toBeTruthy();
      }));

      it('should keep a keyboard-focused tooltip open when the pointer passes over the target', fakeAsync(() => {
        keyboardFocusTarget();
        tick(300);

        divElement.triggerEventHandler('mouseenter', null);
        divElement.triggerEventHandler('mouseleave', null);
        tick(500);

        expect(document.body.querySelector('.cps-tooltip')).toBeTruthy();
      }));

      it('should keep a hover tooltip open under the pointer when focus leaves the target', fakeAsync(() => {
        divElement.triggerEventHandler('mouseenter', null);
        tick(300);

        divElement.triggerEventHandler('focusout', {
          relatedTarget: document.body
        });
        tick(500);

        expect(document.body.querySelector('.cps-tooltip')).toBeTruthy();
      }));

      it('should close a persistent tooltip when focus leaves, even with the pointer on the target', fakeAsync(() => {
        component.persistent = true;
        fixture.detectChanges();
        divElement.triggerEventHandler('mouseenter', null);
        tick(300);

        divElement.triggerEventHandler('focusout', {
          relatedTarget: document.body
        });
        tick(500);

        expect(document.body.querySelector('.cps-tooltip')).toBeFalsy();
      }));

      it('should not keep a closing tooltip open for a pointer that did not come from the target', fakeAsync(() => {
        keyboardFocusTarget();
        tick(300);
        const popup = getPopup();
        Object.defineProperty(document, 'activeElement', {
          value: document.body,
          configurable: true
        });
        divElement.triggerEventHandler('focusout', {
          relatedTarget: document.body
        });

        popup.dispatchEvent(new MouseEvent('mouseenter'));
        tick(500);

        expect(document.body.querySelector('.cps-tooltip')).toBeFalsy();
      }));

      it('should cancel every pending close when the pointer reaches the tooltip', fakeAsync(() => {
        divElement.triggerEventHandler('mouseenter', null);
        tick(300);
        const popup = getPopup();

        divElement.triggerEventHandler('mouseleave', null);
        divElement.triggerEventHandler('focusout', {
          relatedTarget: document.body
        });
        popup.dispatchEvent(new MouseEvent('mouseenter'));
        tick(500);

        expect(document.body.querySelector('.cps-tooltip')).toBeTruthy();
      }));

      it('should stop listening for Esc when the pointer leaves before anything showed', fakeAsync(() => {
        component.persistent = true;
        fixture.detectChanges();
        const removeSpy = jest.spyOn(document, 'removeEventListener');
        try {
          divElement.triggerEventHandler('mouseenter', null);
          divElement.triggerEventHandler('mouseleave', null);

          expect(removeSpy).toHaveBeenCalledWith(
            'keydown',
            expect.any(Function),
            true
          );
          tick(300);
        } finally {
          removeSpy.mockRestore();
        }
      }));

      it('should send focus back to the target when the pointer closes a tooltip holding it', fakeAsync(() => {
        divElement.triggerEventHandler('mouseenter', null);
        tick(300);
        const popup = getPopup();
        const inner = appendFocusable(divElement.nativeElement);
        divElement.triggerEventHandler('mouseleave', null);
        popup.dispatchEvent(new MouseEvent('mouseenter'));
        focusLinkInPopup();

        popup.dispatchEvent(new MouseEvent('mouseleave'));
        tick(1000);

        expect(document.activeElement).toBe(inner);
        expect(document.body.querySelector('.cps-tooltip')).toBeFalsy();
      }));

      it('should keep closing a click-opened tooltip when the pointer leaves the trigger', fakeAsync(() => {
        component.openOn = 'click';
        fixture.detectChanges();
        divElement.triggerEventHandler('click', null);
        tick();
        const popup = getPopup();
        expect(popup.querySelector('.cps-tooltip-bridge')).toBeFalsy();

        divElement.triggerEventHandler('mouseleave', null);
        popup.dispatchEvent(new MouseEvent('mouseenter'));
        tick(500);

        expect(document.body.querySelector('.cps-tooltip')).toBeFalsy();
      }));

      const bridgeCases = [
        [
          'top',
          rect(50, 10, 250, 42),
          ['3.0625rem', '1.9375rem', '6.25rem', '0.5rem']
        ],
        [
          'bottom',
          rect(50, 88, 250, 120),
          ['3.0625rem', '-0.5625rem', '6.25rem', '0.5rem']
        ],
        [
          'left',
          rect(10, 40, 92, 90),
          ['5.0625rem', '0.5625rem', '0.5rem', '1.875rem']
        ],
        [
          'right',
          rect(208, 40, 300, 90),
          ['-0.5625rem', '0.5625rem', '0.5rem', '1.875rem']
        ]
      ] as const;

      for (const [position, popupRect, expected] of bridgeCases) {
        it(`should bridge only the gap facing the target to a ${position} tooltip`, fakeAsync(() => {
          divElement.triggerEventHandler('mouseenter', null);
          tick(300);
          const popup = getPopup();
          popup.style.border = '1px solid';
          jest
            .spyOn(divElement.nativeElement, 'getBoundingClientRect')
            .mockReturnValue(rect(100, 50, 200, 80));
          jest.spyOn(popup, 'getBoundingClientRect').mockReturnValue(popupRect);

          (directive as any)._placeHoverBridge(position);

          const bridge = popup.querySelector(
            '.cps-tooltip-bridge'
          ) as HTMLElement;
          const { left, top, width, height } = bridge.style;
          expect(bridge.getAttribute('aria-hidden')).toBe('true');
          expect([left, top, width, height]).toEqual(expected);
        }));
      }

      it('should not add a bridge to a persistent tooltip', fakeAsync(() => {
        component.persistent = true;
        fixture.detectChanges();
        divElement.triggerEventHandler('mouseenter', null);
        tick(300);

        expect(
          document.body.querySelector('.cps-tooltip .cps-tooltip-bridge')
        ).toBeFalsy();
      }));
    });

    describe('_getOffsetPx units', () => {
      it('should compute px offset', () => {
        component.offset = 10;
        fixture.detectChanges();
        expect((directive as any)._getOffsetPx()).toBe(10);
      });

      it('should compute rem offset', () => {
        component.offset = '2rem';
        fixture.detectChanges();
        expect((directive as any)._getOffsetPx()).toBe(32);
      });

      it('should compute em offset in a browser platform', () => {
        component.offset = '2em';
        fixture.detectChanges();
        expect((directive as any)._getOffsetPx()).toBe(32);
      });

      it('should throw for an unsupported offset unit', () => {
        component.offset = '10%';
        fixture.detectChanges();
        expect(() => (directive as any)._getOffsetPx()).toThrow(
          'Unsupported unit "%" for tooltipOffset.'
        );
      });

      it('should throw for an unparsable offset value', () => {
        component.offset = 'auto';
        fixture.detectChanges();
        expect(() => (directive as any)._getOffsetPx()).toThrow(
          'Unsupported value for tooltipOffset.'
        );
      });
    });

    describe('em offset on a server platform', () => {
      let serverFixture: ComponentFixture<ConfigurableTooltipComponent>;
      let serverDirective: CpsTooltipDirective;

      beforeEach(async () => {
        await TestBed.resetTestingModule();
        await TestBed.configureTestingModule({
          imports: [],
          providers: [
            {
              provide: CPS_ROOT_FONT_SIZE_SERVICE,
              useValue: mockRootFontSizeService
            },
            { provide: PLATFORM_ID, useValue: 'server' }
          ]
        }).compileComponents();

        serverFixture = TestBed.createComponent(ConfigurableTooltipComponent);
        serverFixture.componentInstance.offset = '2em';
        serverFixture.detectChanges();
        serverDirective = serverFixture.debugElement
          .query(By.directive(CpsTooltipDirective))
          .injector.get(CpsTooltipDirective);
      });

      it('should fall back to a default font size of 16px', () => {
        expect((serverDirective as any)._getOffsetPx()).toBe(32);
      });
    });

    describe('_focusableIn', () => {
      it('should only return visible, enabled, tabbable elements', () => {
        const container = document.createElement('div');

        const notTabbable = document.createElement('div');
        notTabbable.tabIndex = -1;
        container.appendChild(notTabbable);

        const disabledInput = document.createElement('input');
        disabledInput.tabIndex = 0;
        disabledInput.disabled = true;
        container.appendChild(disabledInput);

        const zeroSize = document.createElement('div');
        zeroSize.tabIndex = 0;
        container.appendChild(zeroSize);

        const visible = document.createElement('div');
        visible.tabIndex = 0;
        Object.defineProperty(visible, 'offsetWidth', {
          value: 10,
          configurable: true
        });
        container.appendChild(visible);

        const result = (directive as any)._focusableIn(container);
        expect(result).toEqual([visible]);
      });
    });

    describe('onTabFromTrigger', () => {
      it('should do nothing when not persistent', () => {
        const event = { preventDefault: jest.fn() } as unknown as Event;
        directive.onTabFromTrigger(event);
        expect((event as any).preventDefault).not.toHaveBeenCalled();
      });

      it('should do nothing when persistent but there is no popup', () => {
        component.persistent = true;
        fixture.detectChanges();
        const event = { preventDefault: jest.fn() } as unknown as Event;
        directive.onTabFromTrigger(event);
        expect((event as any).preventDefault).not.toHaveBeenCalled();
      });

      it('should do nothing when there are no focusable elements in the popup', fakeAsync(() => {
        component.persistent = true;
        fixture.detectChanges();
        divElement.triggerEventHandler('mouseenter', null);
        tick(300);
        const event = { preventDefault: jest.fn() } as unknown as Event;
        directive.onTabFromTrigger(event);
        expect((event as any).preventDefault).not.toHaveBeenCalled();
      }));

      it('should move focus into the popup when a focusable element exists', fakeAsync(() => {
        component.persistent = true;
        fixture.detectChanges();
        divElement.triggerEventHandler('mouseenter', null);
        tick(300);
        const popup = document.body.querySelector(
          '.cps-tooltip'
        ) as HTMLElement;
        const focusable = document.createElement('div');
        focusable.tabIndex = 0;
        Object.defineProperty(focusable, 'offsetWidth', {
          value: 10,
          configurable: true
        });
        popup.appendChild(focusable);
        const focusSpy = jest.spyOn(focusable, 'focus');

        const event = { preventDefault: jest.fn() } as unknown as Event;
        directive.onTabFromTrigger(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(focusSpy).toHaveBeenCalled();
      }));

      it('should not move focus into a tooltip that has not shown yet, and focus moving into it keeps the show', fakeAsync(() => {
        component.persistent = true;
        fixture.detectChanges();
        keyboardFocusTarget();
        const popup = getPopup();
        const focusable = appendFocusable(popup);

        const event = { preventDefault: jest.fn() } as unknown as Event;
        directive.onTabFromTrigger(event);
        expect(event.preventDefault).not.toHaveBeenCalled();

        divElement.triggerEventHandler('focusout', {
          relatedTarget: focusable
        });
        tick(300);
        expect(popup.style.left).not.toBe('');
      }));
    });
  });
});
