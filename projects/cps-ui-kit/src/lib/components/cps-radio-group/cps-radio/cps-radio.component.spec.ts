import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CpsRadioComponent } from './cps-radio.component';
import { CPS_RADIO_GROUP } from '../cps-radio-group.component';
import { CpsRadioButtonComponent } from '../cps-radio-button/cps-radio-button.component';

describe('CpsRadioComponent', () => {
  const option = { value: 'a', label: 'Option A' };

  describe('without a radio group', () => {
    let component: CpsRadioComponent;
    let fixture: ComponentFixture<CpsRadioComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [CpsRadioComponent]
      }).compileComponents();

      fixture = TestBed.createComponent(CpsRadioComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('option', option);
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should keep groupDisabled false when no radio group is injected', () => {
      expect(component.groupDisabled).toBe(false);
    });

    it('should not throw when updateValueEvent is called without a radio group', () => {
      expect(() => component.updateValueEvent('a')).not.toThrow();
    });

    it('should render a cps-radio-button with the option passed through', () => {
      const radioButton = fixture.debugElement.query(
        By.directive(CpsRadioButtonComponent)
      );
      expect(radioButton).toBeTruthy();
      expect(radioButton.componentInstance.option).toBe(option);
    });
  });

  describe('with a radio group', () => {
    let component: CpsRadioComponent;
    let fixture: ComponentFixture<CpsRadioComponent>;
    let mockGroup: { disabled: boolean; updateValueEvent: jest.Mock };

    beforeEach(async () => {
      mockGroup = { disabled: true, updateValueEvent: jest.fn() };

      await TestBed.configureTestingModule({
        imports: [CpsRadioComponent],
        providers: [{ provide: CPS_RADIO_GROUP, useValue: mockGroup }]
      }).compileComponents();

      fixture = TestBed.createComponent(CpsRadioComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('option', option);
      fixture.detectChanges();
    });

    it('should set groupDisabled from the injected group on init', () => {
      expect(component.groupDisabled).toBe(true);
    });

    it('should delegate updateValueEvent to the injected group', () => {
      component.updateValueEvent('a');
      expect(mockGroup.updateValueEvent).toHaveBeenCalledWith('a');
    });
  });

  describe('with a radio group where disabled is falsy', () => {
    let component: CpsRadioComponent;
    let fixture: ComponentFixture<CpsRadioComponent>;

    beforeEach(async () => {
      const mockGroup = { disabled: false, updateValueEvent: jest.fn() };

      await TestBed.configureTestingModule({
        imports: [CpsRadioComponent],
        providers: [{ provide: CPS_RADIO_GROUP, useValue: mockGroup }]
      }).compileComponents();

      fixture = TestBed.createComponent(CpsRadioComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('option', option);
      fixture.detectChanges();
    });

    it('should set groupDisabled to false', () => {
      expect(component.groupDisabled).toBe(false);
    });
  });
});
