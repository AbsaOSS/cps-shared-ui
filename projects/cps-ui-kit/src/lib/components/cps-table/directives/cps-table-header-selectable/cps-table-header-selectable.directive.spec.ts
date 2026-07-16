import {
  Component,
  ComponentRef,
  ViewChild,
  ViewContainerRef,
  inject
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TableHeaderCheckbox } from '../../../../primeng-temp/table/public_api';
import { CpsTableHeaderSelectableDirective } from './cps-table-header-selectable.directive';

@Component({
  standalone: true,
  template: `<th cpsTHdrSelectable></th>`,
  imports: [CpsTableHeaderSelectableDirective]
})
class TestHostComponent {
  @ViewChild(CpsTableHeaderSelectableDirective)
  directive!: CpsTableHeaderSelectableDirective;
}

@Component({ standalone: true, template: '' })
class VcrProbeComponent {
  readonly vcr = inject(ViewContainerRef);
}

describe('CpsTableHeaderSelectableDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let directive: CpsTableHeaderSelectableDirective;
  let mockCheckboxRef: {
    setInput: jest.Mock;
    destroy: jest.Mock;
    location: { nativeElement: HTMLElement };
  };
  let createComponentSpy: jest.SpyInstance;

  beforeEach(async () => {
    const checkboxEl = document.createElement('div');
    checkboxEl.className = 'p-tableheadercheckbox';

    mockCheckboxRef = {
      setInput: jest.fn(),
      destroy: jest.fn(),
      location: { nativeElement: checkboxEl }
    };

    await TestBed.configureTestingModule({
      imports: [TestHostComponent, VcrProbeComponent, NoopAnimationsModule]
    }).compileComponents();

    const probeFixture = TestBed.createComponent(VcrProbeComponent);
    const vcrProto = Object.getPrototypeOf(probeFixture.componentInstance.vcr);
    createComponentSpy = jest
      .spyOn(vcrProto, 'createComponent')
      .mockReturnValue(
        mockCheckboxRef as unknown as ComponentRef<TableHeaderCheckbox>
      );

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    directive = fixture.componentInstance.directive;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create', () => {
    expect(directive).toBeTruthy();
  });

  describe('constructor', () => {
    it('should call createComponent with TableHeaderCheckbox', () => {
      expect(createComponentSpy).toHaveBeenCalledWith(TableHeaderCheckbox);
    });

    it('should store the ComponentRef in checkboxCompRef', () => {
      expect(directive.checkboxCompRef).toBe(mockCheckboxRef);
    });
  });

  describe('ngOnInit', () => {
    it('should set ariaLabel to "Select all rows" on the checkbox component', () => {
      expect(mockCheckboxRef.setInput).toHaveBeenCalledWith(
        'ariaLabel',
        'Select all rows'
      );
    });

    it('should append the checkbox element inside the host th', () => {
      const th = fixture.debugElement.query(By.css('th'))
        .nativeElement as HTMLElement;
      expect(th.contains(mockCheckboxRef.location.nativeElement)).toBe(true);
    });
  });

  describe('ngOnDestroy', () => {
    it('should call checkboxCompRef.destroy', () => {
      directive.ngOnDestroy();
      expect(mockCheckboxRef.destroy).toHaveBeenCalled();
    });

    it('should call viewContainerRef.clear', () => {
      const vcr = (
        directive as unknown as { viewContainerRef: ViewContainerRef }
      ).viewContainerRef;
      const clearSpy = jest.spyOn(vcr, 'clear');
      directive.ngOnDestroy();
      expect(clearSpy).toHaveBeenCalled();
    });
  });
});
