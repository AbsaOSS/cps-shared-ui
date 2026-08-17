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
import { Component, PLATFORM_ID } from '@angular/core';
import { By } from '@angular/platform-browser';
import { CPS_ROOT_FONT_SIZE_SERVICE } from '../../services/cps-root-font-size/cps-root-font-size.service';

@Component({
  template: `<div cpsTooltip="<style onload='alert(420);'></style>"></div>`,
  imports: [CpsTooltipDirective]
})
class MaliciousTooltipComponent {}
const mockRootFontSizeService = {
  fontSize: () => 16
};

@Component({
  template: `<div cpsTooltip="<h1>Legit tooltip</h1>"></div>`,
  imports: [CpsTooltipDirective]
})
class LegitTooltipComponent {}

@Component({
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
        }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
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
      tick();

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
    });
  });
});
