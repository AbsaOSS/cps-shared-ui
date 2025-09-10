import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick
} from '@angular/core/testing';
import { CpsTooltipDirective } from './cps-tooltip.directive';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';

@Component({
  template: `<div cpsTooltip="<style onload='alert(420);'></style>"></div>`,
  imports: [CpsTooltipDirective]
})
class MaliciousTooltipComponent {}

@Component({
  template: `<div cpsTooltip="<h1>Legit tooltip</h1>"></div>`,
  imports: [CpsTooltipDirective]
})
class LegitTooltipComponent {}

describe('CpsTooltipDirective', () => {
  let legitComponent: LegitTooltipComponent;
  let legitComponentFixture: ComponentFixture<LegitTooltipComponent>;

  let maliciousComponent: MaliciousTooltipComponent;
  let maliciousComponentFixture: ComponentFixture<MaliciousTooltipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: []
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
    expect(tooltipElement?.innerHTML).toBe(
      '<div class="cps-tooltip-content">Add your text to this tooltip</div>'
    );
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
    expect(tooltipElement?.innerHTML).toBe(
      '<div class="cps-tooltip-content"><h1>Legit tooltip</h1></div>'
    );

    divElement.triggerEventHandler('mouseleave', null);
    legitComponentFixture.detectChanges();

    tick(500);

    expect(document.body.querySelector('.cps-tooltip')).toBeFalsy();
  }));
});
