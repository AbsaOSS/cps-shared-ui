import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CpsInfoCircleComponent } from './cps-info-circle.component';
import { CpsIconComponent } from '../cps-icon/cps-icon.component';
import { CpsTooltipDirective } from '../../directives/cps-tooltip/cps-tooltip.directive';

describe('CpsInfoCircleComponent', () => {
  let component: CpsInfoCircleComponent;
  let fixture: ComponentFixture<CpsInfoCircleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CpsInfoCircleComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CpsInfoCircleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should apply default input values', () => {
    expect(component.size).toBe('small');
    expect(component.tooltipText).toBe('');
    expect(component.tooltipPosition).toBe('top');
    expect(component.tooltipContentClass).toBe('cps-tooltip-content');
    expect(component.tooltipMaxWidth).toBe('100%');
    expect(component.tooltipPersistent).toBe(false);
  });

  it('should render a cps-icon element and pass size through to it', () => {
    const icon = fixture.debugElement.query(By.directive(CpsIconComponent));
    expect(icon).toBeTruthy();
    expect(icon.componentInstance.size).toBe('small');
  });

  it('should update the icon size when the size input changes', () => {
    fixture.componentRef.setInput('size', 'large');
    fixture.detectChanges();

    const icon = fixture.debugElement.query(By.directive(CpsIconComponent));
    expect(icon.componentInstance.size).toBe('large');
  });

  it('should wire the CpsTooltipDirective with the configured tooltip inputs', () => {
    fixture.componentRef.setInput('tooltipText', 'Some helpful text');
    fixture.componentRef.setInput('tooltipPosition', 'bottom');
    fixture.componentRef.setInput('tooltipContentClass', 'my-tooltip-class');
    fixture.componentRef.setInput('tooltipMaxWidth', 200);
    fixture.componentRef.setInput('tooltipPersistent', true);
    fixture.detectChanges();

    const tooltip = fixture.debugElement.query(
      By.directive(CpsTooltipDirective)
    );
    expect(tooltip).toBeTruthy();

    const directive: CpsTooltipDirective =
      tooltip.injector.get(CpsTooltipDirective);
    expect(directive.tooltip()).toBe('Some helpful text');
    expect(directive.tooltipPosition()).toBe('bottom');
    expect(directive.tooltipContentClass()).toBe('my-tooltip-class');
    expect(directive.tooltipMaxWidth()).toBe(200);
    expect(directive.tooltipPersistent()).toBe(true);
  });
});
