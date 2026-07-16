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
import { TableCheckbox } from '../../../../primeng-temp/table/public_api';
import { CpsTableRowSelectableDirective } from './cps-table-row-selectable.directive';

@Component({
  standalone: true,
  template: `<td [cpsTRowSelectable]="value"></td>`,
  imports: [CpsTableRowSelectableDirective]
})
class TestHostComponent {
  @ViewChild(CpsTableRowSelectableDirective)
  directive!: CpsTableRowSelectableDirective;

  value: unknown = 'row-1';
}

@Component({ standalone: true, template: '' })
class VcrProbeComponent {
  readonly vcr = inject(ViewContainerRef);
}

describe('CpsTableRowSelectableDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let directive: CpsTableRowSelectableDirective;
  let mockCheckboxRef: {
    setInput: jest.Mock;
    destroy: jest.Mock;
    location: { nativeElement: HTMLElement };
  };
  let createComponentSpy: jest.SpyInstance;

  beforeEach(async () => {
    const checkboxEl = document.createElement('div');
    checkboxEl.className = 'p-tablecheckbox';

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
        mockCheckboxRef as unknown as ComponentRef<TableCheckbox>
      );

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    directive = host.directive;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create', () => {
    expect(directive).toBeTruthy();
  });

  describe('constructor', () => {
    it('should call createComponent with TableCheckbox', () => {
      expect(createComponentSpy).toHaveBeenCalledWith(TableCheckbox);
    });

    it('should store the ComponentRef in checkboxCompRef', () => {
      expect(directive.checkboxCompRef).toBe(mockCheckboxRef);
    });
  });

  describe('value input', () => {
    it('should accept value via cpsTRowSelectable alias', () => {
      expect(directive.value).toBe('row-1');
    });

    it('should update value when the input changes', () => {
      host.value = { id: 42 };
      fixture.detectChanges();
      expect(directive.value).toEqual({ id: 42 });
    });
  });

  describe('ngOnInit', () => {
    it('should call setInput with the bound value', () => {
      expect(mockCheckboxRef.setInput).toHaveBeenCalledWith('value', 'row-1');
    });

    it('should append the checkbox element inside the host td', () => {
      const td = fixture.debugElement.query(By.css('td'))
        .nativeElement as HTMLElement;
      expect(td.contains(mockCheckboxRef.location.nativeElement)).toBe(true);
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
