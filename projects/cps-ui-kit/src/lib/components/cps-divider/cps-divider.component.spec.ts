import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CpsDividerComponent } from './cps-divider.component';
import { Component } from '@angular/core';

@Component({
  template: `
    <cps-divider
      [vertical]="vertical"
      [color]="color"
      [type]="type"
      [thickness]="thickness">
    </cps-divider>
  `,
  imports: [CpsDividerComponent]
})
class TestHostComponent {
  vertical = false;
  color = 'line-mid';
  type: 'solid' | 'dashed' | 'dotted' = 'solid';
  thickness: number | string = '0.0625rem';
}

describe('CpsDividerComponent', () => {
  let component: CpsDividerComponent;
  let fixture: ComponentFixture<CpsDividerComponent>;
  let hostFixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CpsDividerComponent, TestHostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CpsDividerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.vertical()).toBe(false);
    expect(component.color()).toBe('line-mid');
    expect(component.type()).toBe('solid');
    expect(component.thickness()).toBe('0.0625rem');
  });

  it('should be horizontal by default', () => {
    expect(component.vertical()).toBe(false);
  });

  it('should apply vertical orientation when vertical is true', () => {
    fixture.componentRef.setInput('vertical', true);
    fixture.detectChanges();
    expect(component.vertical()).toBe(true);
  });

  it('should apply solid type', () => {
    fixture.componentRef.setInput('type', 'solid');
    fixture.detectChanges();
    expect(component.type()).toBe('solid');
  });

  it('should apply dashed type', () => {
    fixture.componentRef.setInput('type', 'dashed');
    fixture.detectChanges();
    expect(component.type()).toBe('dashed');
  });

  it('should apply dotted type', () => {
    fixture.componentRef.setInput('type', 'dotted');
    fixture.detectChanges();
    expect(component.type()).toBe('dotted');
  });

  it('should set custom color', () => {
    fixture.componentRef.setInput('color', 'primary');
    fixture.detectChanges();
    expect(component.color()).toBe('primary');
  });

  it('should set custom thickness as number', () => {
    fixture.componentRef.setInput('thickness', 2);
    fixture.detectChanges();
    expect(component.thickness()).toBe(2);
  });

  it('should set custom thickness as string', () => {
    fixture.componentRef.setInput('thickness', '3px');
    fixture.detectChanges();
    expect(component.thickness()).toBe('3px');
  });

  it('should have cps-divider class', () => {
    const divider = fixture.nativeElement;
    expect(divider.classList.contains('cps-divider')).toBe(true);
  });

  it('should have role="separator"', () => {
    const divider = fixture.nativeElement;
    expect(divider.getAttribute('role')).toBe('separator');
  });

  it('should have aria-orientation="horizontal" by default', () => {
    const divider = fixture.nativeElement;
    expect(divider.getAttribute('aria-orientation')).toBe('horizontal');
  });

  it('should have aria-orientation="vertical" when vertical is true', () => {
    fixture.componentRef.setInput('vertical', true);
    fixture.detectChanges();
    const divider = fixture.nativeElement;
    expect(divider.getAttribute('aria-orientation')).toBe('vertical');
  });

  it('should revert aria-orientation to "horizontal" when vertical is set back to false', () => {
    fixture.componentRef.setInput('vertical', true);
    fixture.detectChanges();
    fixture.componentRef.setInput('vertical', false);
    fixture.detectChanges();
    const divider = fixture.nativeElement;
    expect(divider.getAttribute('aria-orientation')).toBe('horizontal');
  });
});
