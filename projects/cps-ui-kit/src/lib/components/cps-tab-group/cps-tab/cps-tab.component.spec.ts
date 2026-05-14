import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CpsTabComponent } from './cps-tab.component';

@Component({
  standalone: true,
  imports: [CpsTabComponent],
  template: `
    <cps-tab
      [label]="label"
      [ariaLabel]="ariaLabel"
      [icon]="icon"
      [disabled]="disabled"
      [tooltipText]="tooltipText"
      [tooltipContentClass]="tooltipContentClass"
      [tooltipMaxWidth]="tooltipMaxWidth"
      [tooltipPersistent]="tooltipPersistent"
      [badgeValue]="badgeValue"
      [badgeTooltip]="badgeTooltip">
      <span class="projected">Projected content</span>
    </cps-tab>
  `
})
class TestHostComponent {
  label = 'Test Tab';
  ariaLabel = '';
  icon = '';
  disabled = false;
  tooltipText = '';
  tooltipContentClass = 'cps-tooltip-content';
  tooltipMaxWidth: number | string = '100%';
  tooltipPersistent = false;
  badgeValue = '';
  badgeTooltip = '';
}

describe('CpsTabComponent', () => {
  let hostFixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let component: CpsTabComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent]
    }).compileComponents();

    hostFixture = TestBed.createComponent(TestHostComponent);
    host = hostFixture.componentInstance;
    hostFixture.detectChanges();

    component = hostFixture.debugElement.children[0].componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct default input values', () => {
    host.label = '';
    host.ariaLabel = 'fallback';
    hostFixture.detectChanges();

    expect(component.ariaLabel).toBe('fallback');
    expect(component.icon).toBe('');
    expect(component.disabled).toBe(false);
    expect(component.tooltipText).toBe('');
    expect(component.tooltipContentClass).toBe('cps-tooltip-content');
    expect(component.tooltipMaxWidth).toBe('100%');
    expect(component.tooltipPersistent).toBe(false);
    expect(component.badgeValue).toBe('');
    expect(component.badgeTooltip).toBe('');
  });

  it('should start as inactive', () => {
    expect(component.active).toBe(false);
  });

  it('should reflect label input', () => {
    host.label = 'My Tab';
    hostFixture.detectChanges();
    expect(component.label).toBe('My Tab');
  });

  it('should reflect ariaLabel input', () => {
    host.ariaLabel = 'Accessible name';
    hostFixture.detectChanges();
    expect(component.ariaLabel).toBe('Accessible name');
  });

  it('should reflect icon input', () => {
    host.icon = 'home';
    hostFixture.detectChanges();
    expect(component.icon).toBe('home');
  });

  it('should reflect disabled input', () => {
    host.disabled = true;
    hostFixture.detectChanges();
    expect(component.disabled).toBe(true);
  });

  it('should reflect tooltipText input', () => {
    host.tooltipText = 'Hover me';
    hostFixture.detectChanges();
    expect(component.tooltipText).toBe('Hover me');
  });

  it('should reflect tooltipContentClass input', () => {
    host.tooltipContentClass = 'custom-class';
    hostFixture.detectChanges();
    expect(component.tooltipContentClass).toBe('custom-class');
  });

  it('should reflect tooltipMaxWidth input as number', () => {
    host.tooltipMaxWidth = 300;
    hostFixture.detectChanges();
    expect(component.tooltipMaxWidth).toBe(300);
  });

  it('should reflect tooltipMaxWidth input as string', () => {
    host.tooltipMaxWidth = '50%';
    hostFixture.detectChanges();
    expect(component.tooltipMaxWidth).toBe('50%');
  });

  it('should reflect tooltipPersistent input', () => {
    host.tooltipPersistent = true;
    hostFixture.detectChanges();
    expect(component.tooltipPersistent).toBe(true);
  });

  it('should reflect badgeValue input', () => {
    host.badgeValue = '5';
    hostFixture.detectChanges();
    expect(component.badgeValue).toBe('5');
  });

  it('should reflect badgeTooltip input', () => {
    host.badgeTooltip = 'Five items';
    hostFixture.detectChanges();
    expect(component.badgeTooltip).toBe('Five items');
  });

  it('should become active when active is set to true', () => {
    component.active = true;
    expect(component.active).toBe(true);
  });

  it('should become inactive when active is set back to false', () => {
    component.active = true;
    component.active = false;
    expect(component.active).toBe(false);
  });

  it('should expose a content TemplateRef', () => {
    expect(component.content).toBeTruthy();
  });

  it('should project content into the template', () => {
    const projected = hostFixture.nativeElement.querySelector('.projected');
    expect(projected).toBeTruthy();
    expect(projected.textContent).toBe('Projected content');
  });

  it('should log an error when both label and ariaLabel are empty', () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.label = '';
    fixture.componentInstance.ariaLabel = '';
    fixture.detectChanges();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('ariaLabel for accessibility')
    );

    consoleSpy.mockRestore();
  });

  it('should not log an error when label is provided', () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.label = 'Valid';
    fixture.componentInstance.ariaLabel = '';
    fixture.detectChanges();

    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should not log an error when only ariaLabel is provided', () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.label = '';
    fixture.componentInstance.ariaLabel = 'Accessible only';
    fixture.detectChanges();

    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should log an error when label is whitespace only', () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.label = '   ';
    fixture.componentInstance.ariaLabel = '';
    fixture.detectChanges();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('ariaLabel for accessibility')
    );

    consoleSpy.mockRestore();
  });
});
