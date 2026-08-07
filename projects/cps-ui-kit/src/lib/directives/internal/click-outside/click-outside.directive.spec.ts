import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ClickOutsideDirective } from './click-outside.directive';

@Component({
  template: `
    <div
      id="host"
      [class.focused]="focused"
      clickOutside
      [skipTargets]="skipTargets"
      (clickOutside)="onClickOutside()">
      <span id="inside">Inside</span>
    </div>
  `,
  imports: [ClickOutsideDirective]
})
class TestHostComponent {
  @ViewChild(ClickOutsideDirective) directive!: ClickOutsideDirective;
  focused = false;
  skipTargets: string[] = [];
  clickOutsideCount = 0;

  onClickOutside() {
    this.clickOutsideCount++;
  }
}

describe('ClickOutsideDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;
  const appendedElements: HTMLElement[] = [];

  const appendOutsideElement = (classes: string[] = []): HTMLElement => {
    const el = document.createElement('span');
    el.classList.add(...classes);
    document.body.appendChild(el);
    appendedElements.push(el);
    return el;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    appendedElements.forEach((el) => el.remove());
    appendedElements.length = 0;
  });

  it('should create', () => {
    expect(component.directive).toBeTruthy();
  });

  it('should not emit clickOutside when the host lacks the focused class', () => {
    const outside = appendOutsideElement();

    outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(component.clickOutsideCount).toBe(0);
  });

  describe('when the host has the focused class', () => {
    beforeEach(() => {
      component.focused = true;
      fixture.detectChanges();
    });

    it('should emit clickOutside when the click target is outside the host and connected to the DOM', () => {
      const outside = appendOutsideElement();

      outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(component.clickOutsideCount).toBe(1);
    });

    it('should not emit clickOutside when the click target is inside the host', () => {
      const inside = fixture.debugElement.query(By.css('#inside'))
        .nativeElement as HTMLElement;

      inside.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(component.clickOutsideCount).toBe(0);
    });

    it('should not emit clickOutside when the click target is the host itself', () => {
      const host = fixture.debugElement.query(By.css('#host'))
        .nativeElement as HTMLElement;

      host.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(component.clickOutsideCount).toBe(0);
    });

    it("should emit clickOutside when the click target's classList matches a configured skipTargets class", () => {
      component.skipTargets = ['skip-me'];
      fixture.detectChanges();

      const inside = fixture.debugElement.query(By.css('#inside'))
        .nativeElement as HTMLElement;
      inside.classList.add('skip-me');

      inside.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(component.clickOutsideCount).toBe(1);
    });

    it('should match any one of multiple configured skipTargets classes', () => {
      component.skipTargets = ['skip-a', 'skip-b'];
      fixture.detectChanges();

      const inside = fixture.debugElement.query(By.css('#inside'))
        .nativeElement as HTMLElement;
      inside.classList.add('skip-b');

      inside.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(component.clickOutsideCount).toBe(1);
    });

    it('should not emit clickOutside for a detached target not in skipTargets', () => {
      const detached = document.createElement('span');

      component.directive.onClick(detached);

      expect(component.clickOutsideCount).toBe(0);
    });
  });
});
