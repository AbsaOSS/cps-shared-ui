import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FilterMetadata } from 'primeng/api';
import { Table } from 'primeng/table';
import { TableColumnFilterConstraintComponent } from './table-column-filter-constraint.component';
import { CpsColumnFilterCategoryOption } from '../../../cps-column-filter-types';

describe('TableColumnFilterConstraintComponent', () => {
  let component: TableColumnFilterConstraintComponent;
  let fixture: ComponentFixture<TableColumnFilterConstraintComponent>;
  let mockTable: Table;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableColumnFilterConstraintComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(TableColumnFilterConstraintComponent);
    component = fixture.componentInstance;

    mockTable = Object.create(Table.prototype) as Table;
    (mockTable as { ngOnDestroy: () => void }).ngOnDestroy = jest.fn();
    (mockTable as { value: unknown[] }).value = [];
    jest.spyOn(mockTable, 'isFilterBlank').mockReturnValue(false);
    jest.spyOn(mockTable, '_filter').mockImplementation(() => {});
    component._tableInstance = mockTable;

    fixture.detectChanges();
  });

  afterEach(() => {
    document.body
      .querySelectorAll('.cps-menu-container, .cps-overlay-panel')
      .forEach((el) => el.remove());
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('default values', () => {
    it('should default type to "text"', () => {
      expect(component.type).toBe('text');
    });

    it('should default field to undefined', () => {
      expect(component.field).toBeUndefined();
    });

    it('should default filterConstraint to undefined', () => {
      expect(component.filterConstraint).toBeUndefined();
    });

    it('should default categoryOptions to []', () => {
      expect(component.categoryOptions).toEqual([]);
    });

    it('should default asButtonToggle to false', () => {
      expect(component.asButtonToggle).toBe(false);
    });

    it('should default singleSelection to false', () => {
      expect(component.singleSelection).toBe(false);
    });

    it('should default placeholder to empty string', () => {
      expect(component.placeholder).toBe('');
    });

    it('should default hasApplyButton to true', () => {
      expect(component.hasApplyButton).toBe(true);
    });

    it('should initialize booleanOptions with True and False entries', () => {
      expect(component.booleanOptions).toEqual([
        { label: 'True', value: 'true' },
        { label: 'False', value: 'false' }
      ]);
    });

    it('should initialize categories to empty array', () => {
      expect(component.categories).toEqual([]);
    });

    it('should return false for isCategoryDropdownOpened when no autocomplete is mounted', () => {
      expect(component.isCategoryDropdownOpened).toBe(false);
    });
  });

  describe('_updateCategories (via ngOnChanges)', () => {
    it('should not populate categories when type is not "category"', () => {
      fixture.componentRef.setInput('type', 'text');
      fixture.componentRef.setInput('categoryOptions', ['A', 'B']);
      fixture.detectChanges();
      expect(component.categories).toEqual([]);
    });

    it('should convert string categoryOptions to {label, value} objects', () => {
      fixture.componentRef.setInput('type', 'category');
      fixture.componentRef.setInput('categoryOptions', ['Apple', 'Banana']);
      fixture.detectChanges();
      expect(component.categories).toEqual([
        { label: 'Apple', value: 'Apple' },
        { label: 'Banana', value: 'Banana' }
      ]);
    });

    it('should use object categoryOptions as-is', () => {
      const options: CpsColumnFilterCategoryOption[] = [
        { label: 'Option A', value: 1 },
        { label: 'Option B', value: 2 }
      ];
      fixture.componentRef.setInput('type', 'category');
      fixture.componentRef.setInput('categoryOptions', options);
      fixture.detectChanges();
      expect(component.categories).toEqual(options);
    });

    it('should derive categories from table data when categoryOptions is empty', () => {
      (mockTable as { value: unknown[] }).value = [
        { name: 'Alice' },
        { name: 'Bob' },
        { name: 'Charlie' }
      ];
      fixture.componentRef.setInput('type', 'category');
      fixture.componentRef.setInput('field', 'name');
      fixture.detectChanges();
      expect(component.categories).toEqual([
        { label: 'Alice', value: 'Alice' },
        { label: 'Bob', value: 'Bob' },
        { label: 'Charlie', value: 'Charlie' }
      ]);
    });

    it('should deduplicate categories derived from table data', () => {
      (mockTable as { value: unknown[] }).value = [
        { status: 'Active' },
        { status: 'Active' },
        { status: 'Inactive' }
      ];
      fixture.componentRef.setInput('type', 'category');
      fixture.componentRef.setInput('field', 'status');
      fixture.detectChanges();
      expect(component.categories).toEqual([
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' }
      ]);
    });
  });

  describe('onValueChange', () => {
    let filterConstraint: FilterMetadata;

    beforeEach(() => {
      filterConstraint = { value: null, matchMode: 'contains' };
      fixture.componentRef.setInput('filterConstraint', filterConstraint);
    });

    it('should update filterConstraint.value', () => {
      component.onValueChange('test');
      expect(filterConstraint.value).toBe('test');
    });

    it('should call _filter when value is blank', () => {
      jest.mocked(mockTable.isFilterBlank).mockReturnValue(true);
      component.onValueChange('');
      expect(jest.mocked(mockTable._filter)).toHaveBeenCalled();
    });

    it('should call _filter when hasApplyButton is false', () => {
      fixture.componentRef.setInput('hasApplyButton', false);
      component.onValueChange('test');
      expect(jest.mocked(mockTable._filter)).toHaveBeenCalled();
    });

    it('should not call _filter when value is not blank and hasApplyButton is true', () => {
      jest.mocked(mockTable.isFilterBlank).mockReturnValue(false);
      component.onValueChange('test');
      expect(jest.mocked(mockTable._filter)).not.toHaveBeenCalled();
    });
  });

  describe('onEnterKeyDown', () => {
    it('should call _filter', () => {
      const event = { preventDefault: jest.fn() };
      component.onEnterKeyDown(event);
      expect(jest.mocked(mockTable._filter)).toHaveBeenCalled();
    });

    it('should call event.preventDefault', () => {
      const event = { preventDefault: jest.fn() };
      component.onEnterKeyDown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('template', () => {
    it('should render cps-input for type "text"', () => {
      expect(fixture.nativeElement.querySelector('cps-input')).toBeTruthy();
    });

    it('should render cps-input for type "number"', () => {
      fixture.componentRef.setInput('type', 'number');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('cps-input')).toBeTruthy();
    });

    it('should render cps-button-toggle for type "boolean"', () => {
      fixture.componentRef.setInput('type', 'boolean');
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector('cps-button-toggle')
      ).toBeTruthy();
    });

    it('should render cps-datepicker for type "date"', () => {
      fixture.componentRef.setInput('type', 'date');
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector('cps-datepicker')
      ).toBeTruthy();
    });

    it('should render cps-autocomplete for type "category" when asButtonToggle is false', () => {
      fixture.componentRef.setInput('type', 'category');
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector('cps-autocomplete')
      ).toBeTruthy();
    });

    it('should render cps-button-toggle and no cps-autocomplete for type "category" when asButtonToggle is true', () => {
      fixture.componentRef.setInput('type', 'category');
      fixture.componentRef.setInput('asButtonToggle', true);
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector('cps-button-toggle')
      ).toBeTruthy();
      expect(
        fixture.nativeElement.querySelector('cps-autocomplete')
      ).toBeNull();
    });
  });
});
