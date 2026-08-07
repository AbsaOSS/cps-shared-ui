import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { EventEmitter } from '@angular/core';
import { FilterMetadata, FilterOperator } from 'primeng/api';
import { Table } from 'primeng/table';
import { TableColumnFilterComponent } from './table-column-filter.component';
import { CpsColumnFilterMatchMode } from '../../../cps-column-filter-types';

describe('TableColumnFilterComponent', () => {
  let component: TableColumnFilterComponent;
  let fixture: ComponentFixture<TableColumnFilterComponent>;
  let mockTable: Table;
  let onFilterEmitter: EventEmitter<any>;

  function buildMockTable(): Table {
    onFilterEmitter = new EventEmitter();
    const t = Object.create(Table.prototype) as Table;
    (t as { ngOnDestroy: () => void }).ngOnDestroy = jest.fn();
    (t as { filters: Record<string, unknown> }).filters = {};
    (t as { onFilter: EventEmitter<any> }).onFilter = onFilterEmitter;
    jest.spyOn(t, 'isFilterBlank').mockReturnValue(false);
    jest.spyOn(t, '_filter').mockImplementation(() => {});
    return t;
  }

  beforeEach(async () => {
    mockTable = buildMockTable();

    await TestBed.configureTestingModule({
      imports: [TableColumnFilterComponent, NoopAnimationsModule],
      providers: [{ provide: Table, useValue: mockTable }]
    }).compileComponents();

    fixture = TestBed.createComponent(TableColumnFilterComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('field', 'name');
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

    it('should default persistent to false', () => {
      expect(component.persistent).toBe(false);
    });

    it('should default showClearButton to true', () => {
      expect(component.showClearButton).toBe(true);
    });

    it('should default showCloseButton to false', () => {
      expect(component.showCloseButton).toBe(false);
    });

    it('should default showMatchModes to true', () => {
      expect(component.showMatchModes).toBe(true);
    });

    it('should default showOperator to true', () => {
      expect(component.showOperator).toBe(true);
    });

    it('should default maxConstraints to 2', () => {
      expect(component.maxConstraints).toBe(2);
    });

    it('should default headerTitle to empty string', () => {
      expect(component.headerTitle).toBe('');
    });

    it('should default hideOnClear to false', () => {
      expect(component.hideOnClear).toBe(false);
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

    it('should default operator to AND', () => {
      expect(component.operator).toBe(FilterOperator.AND);
    });

    it('should default isFilterApplied to false', () => {
      expect(component.isFilterApplied).toBe(false);
    });

    it('should default isMenuOpen to false', () => {
      expect(component.isMenuOpen).toBe(false);
    });

    it('should expose Match All and Match Any operatorOptions', () => {
      expect(component.operatorOptions).toEqual([
        { label: 'Match All', value: FilterOperator.AND, info: 'AND' },
        { label: 'Match Any', value: FilterOperator.OR, info: 'OR' }
      ]);
    });
  });

  describe('ngOnInit', () => {
    it('should force showApplyButton true when maxConstraints > 1 and type is not category', () => {
      expect(component.showApplyButton).toBe(true);
    });

    it('should force showApplyButton false when type is "boolean"', () => {
      (mockTable as any).filters = {};
      const f = TestBed.createComponent(TableColumnFilterComponent);
      f.componentRef.setInput('field', 'name');
      f.componentRef.setInput('type', 'boolean');
      f.detectChanges();
      expect(f.componentInstance.showApplyButton).toBe(false);
    });

    it('should initialize field filter constraint when field is not in filters', () => {
      const constraints = (mockTable as any).filters.name as FilterMetadata[];
      expect(Array.isArray(constraints)).toBe(true);
      expect(constraints.length).toBe(1);
      expect(constraints[0].value).toBeNull();
      expect(constraints[0].matchMode).toBe(
        CpsColumnFilterMatchMode.STARTS_WITH
      );
      expect(constraints[0].operator).toBe(FilterOperator.AND);
    });

    it('should not reinitialize filter constraint when field is already in filters', () => {
      (mockTable as any).filters.name = [
        { value: 'existing', matchMode: 'contains', operator: 'and' }
      ];
      const f = TestBed.createComponent(TableColumnFilterComponent);
      f.componentRef.setInput('field', 'name');
      f.detectChanges();
      expect(
        ((mockTable as any).filters.name as FilterMetadata[])[0].value
      ).toBe('existing');
    });

    it('should override match modes when matchModes input is provided', () => {
      (mockTable as any).filters = {};
      const f = TestBed.createComponent(TableColumnFilterComponent);
      f.componentRef.setInput('field', 'name');
      f.componentRef.setInput('matchModes', [
        CpsColumnFilterMatchMode.EQUALS,
        CpsColumnFilterMatchMode.NOT_EQUALS
      ]);
      f.detectChanges();
      expect(f.componentInstance.currentMatchModes?.length).toBe(2);
      expect(f.componentInstance.currentMatchModes?.[0].value).toBe(
        CpsColumnFilterMatchMode.EQUALS
      );
    });
  });

  describe('currentMatchModes', () => {
    function createWithType(type: string): TableColumnFilterComponent {
      const f = TestBed.createComponent(TableColumnFilterComponent);
      f.componentRef.setInput('field', 'name');
      f.componentRef.setInput('type', type as never);
      f.detectChanges();
      return f.componentInstance;
    }

    it('should set 6 match modes for type "text"', () => {
      expect(component.currentMatchModes?.length).toBe(6);
    });

    it('should set 6 match modes for type "number"', () => {
      expect(createWithType('number').currentMatchModes?.length).toBe(6);
    });

    it('should set 4 match modes for type "date"', () => {
      expect(createWithType('date').currentMatchModes?.length).toBe(4);
    });

    it('should set currentMatchModes to undefined for type "category"', () => {
      expect(createWithType('category').currentMatchModes).toBeUndefined();
    });

    it('should set currentMatchModes to undefined for type "boolean"', () => {
      expect(createWithType('boolean').currentMatchModes).toBeUndefined();
    });
  });

  describe('_getDefaultMatchMode (via initialized filter constraint)', () => {
    function constraintMatchMode(
      type: string,
      singleSelection = false
    ): string {
      const t = buildMockTable();
      const f = TestBed.createComponent(TableColumnFilterComponent);
      (f.componentInstance as any)._tableInstance = t;
      f.componentRef.setInput('field', 'col');
      f.componentRef.setInput('type', type as never);
      f.componentRef.setInput('singleSelection', singleSelection);
      f.detectChanges();
      return ((t as any).filters.col as FilterMetadata[])?.[0]?.matchMode ?? '';
    }

    it('should use startsWith for type "text"', () => {
      const constraint = (
        (mockTable as any).filters.name as FilterMetadata[]
      )[0];
      expect(constraint.matchMode).toBe(CpsColumnFilterMatchMode.STARTS_WITH);
    });

    it('should use equals for type "number"', () => {
      expect(constraintMatchMode('number')).toBe(
        CpsColumnFilterMatchMode.EQUALS
      );
    });

    it('should use dateIs for type "date"', () => {
      expect(constraintMatchMode('date')).toBe(
        CpsColumnFilterMatchMode.DATE_IS
      );
    });

    it('should use "in" for category with singleSelection=false', () => {
      expect(constraintMatchMode('category', false)).toBe(
        CpsColumnFilterMatchMode.IN
      );
    });

    it('should use "is" for category with singleSelection=true', () => {
      expect(constraintMatchMode('category', true)).toBe(
        CpsColumnFilterMatchMode.IS
      );
    });
  });

  describe('fieldConstraints', () => {
    it('should return the array of constraints for the field', () => {
      const constraints = component.fieldConstraints;
      expect(Array.isArray(constraints)).toBe(true);
      expect(constraints!.length).toBe(1);
    });

    it('should return null when filters is empty', () => {
      (mockTable as any).filters = undefined;
      expect(component.fieldConstraints).toBeNull();
    });
  });

  describe('showRemoveIcon', () => {
    it('should be false when there is one constraint', () => {
      expect(component.showRemoveIcon).toBe(false);
    });

    it('should be true when there are two or more constraints', () => {
      component.addConstraint();
      expect(component.showRemoveIcon).toBe(true);
    });
  });

  describe('isShowOperator', () => {
    it('should be true with default settings (type="text", maxConstraints=2)', () => {
      expect(component.isShowOperator).toBe(true);
    });

    it('should be false when showOperator is false', () => {
      fixture.componentRef.setInput('showOperator', false);
      expect(component.isShowOperator).toBe(false);
    });

    it('should be false when maxConstraints is 1', () => {
      fixture.componentRef.setInput('maxConstraints', 1);
      expect(component.isShowOperator).toBe(false);
    });

    it('should be false when type is "boolean"', () => {
      fixture.componentRef.setInput('type', 'boolean');
      expect(component.isShowOperator).toBe(false);
    });

    it('should be false when type is "category"', () => {
      fixture.componentRef.setInput('type', 'category');
      expect(component.isShowOperator).toBe(false);
    });
  });

  describe('isShowAddConstraint', () => {
    it('should be true when constraints < maxConstraints', () => {
      expect(component.isShowAddConstraint).toBe(true);
    });

    it('should be false when constraints equals maxConstraints', () => {
      component.addConstraint();
      expect(component.isShowAddConstraint).toBe(false);
    });

    it('should be false when type is "boolean"', () => {
      fixture.componentRef.setInput('type', 'boolean');
      expect(component.isShowAddConstraint).toBeFalsy();
    });

    it('should be false when type is "category"', () => {
      fixture.componentRef.setInput('type', 'category');
      expect(component.isShowAddConstraint).toBeFalsy();
    });
  });

  describe('isCategoryDropdownOpened', () => {
    it('should return false when type is not "category"', () => {
      expect(component.isCategoryDropdownOpened).toBe(false);
    });
  });

  describe('addConstraint', () => {
    it('should add a new constraint to the field filters', () => {
      component.addConstraint();
      const constraints = (mockTable as any).filters.name as FilterMetadata[];
      expect(constraints.length).toBe(2);
    });

    it('should set new constraint value to null', () => {
      component.addConstraint();
      const constraints = (mockTable as any).filters.name as FilterMetadata[];
      expect(constraints[1].value).toBeNull();
    });

    it('should inherit the current operator on the new constraint', () => {
      component.addConstraint();
      const constraints = (mockTable as any).filters.name as FilterMetadata[];
      expect(constraints[1].operator).toBe(FilterOperator.AND);
    });
  });

  describe('removeConstraint', () => {
    it('should remove the specified constraint', () => {
      component.addConstraint();
      const constraints = (mockTable as any).filters.name as FilterMetadata[];
      const toRemove = constraints[0];
      component.removeConstraint(toRemove);
      expect(((mockTable as any).filters.name as FilterMetadata[]).length).toBe(
        1
      );
      expect((mockTable as any).filters.name).not.toContain(toRemove);
    });

    it('should call _filter after removing', () => {
      component.addConstraint();
      const first = ((mockTable as any).filters.name as FilterMetadata[])[0];
      component.removeConstraint(first);
      expect(jest.mocked(mockTable._filter)).toHaveBeenCalled();
    });
  });

  describe('onMenuMatchModeChange', () => {
    it('should update filterMeta.matchMode', () => {
      const meta: FilterMetadata = { value: null, matchMode: 'contains' };
      component.onMenuMatchModeChange('equals', meta);
      expect(meta.matchMode).toBe('equals');
    });

    it('should call _filter when showApplyButton is false', () => {
      fixture.componentRef.setInput('showApplyButton', false);
      const meta: FilterMetadata = { value: null, matchMode: 'contains' };
      component.onMenuMatchModeChange('equals', meta);
      expect(jest.mocked(mockTable._filter)).toHaveBeenCalled();
    });

    it('should not call _filter when showApplyButton is true', () => {
      const meta: FilterMetadata = { value: null, matchMode: 'contains' };
      component.onMenuMatchModeChange('equals', meta);
      expect(jest.mocked(mockTable._filter)).not.toHaveBeenCalled();
    });
  });

  describe('onOperatorChange', () => {
    it('should update operator on component', () => {
      component.onOperatorChange(FilterOperator.OR);
      expect(component.operator).toBe(FilterOperator.OR);
    });

    it('should update operator on all constraints', () => {
      component.addConstraint();
      component.onOperatorChange(FilterOperator.OR);
      const constraints = (mockTable as any).filters.name as FilterMetadata[];
      expect(constraints.every((c) => c.operator === FilterOperator.OR)).toBe(
        true
      );
    });

    it('should call _filter when showApplyButton is false', () => {
      fixture.componentRef.setInput('showApplyButton', false);
      component.onOperatorChange(FilterOperator.OR);
      expect(jest.mocked(mockTable._filter)).toHaveBeenCalled();
    });

    it('should not call _filter when showApplyButton is true', () => {
      component.onOperatorChange(FilterOperator.OR);
      expect(jest.mocked(mockTable._filter)).not.toHaveBeenCalled();
    });
  });

  describe('clearFilter', () => {
    it('should reset filter constraint value to null', () => {
      ((mockTable as any).filters.name as FilterMetadata[])[0].value = 'test';
      component.clearFilter();
      expect(
        ((mockTable as any).filters.name as FilterMetadata[])[0].value
      ).toBeNull();
    });

    it('should call _filter', () => {
      component.clearFilter();
      expect(jest.mocked(mockTable._filter)).toHaveBeenCalled();
    });

    it('should call hide when hideOnClear is true', () => {
      fixture.componentRef.setInput('hideOnClear', true);
      jest.spyOn(component.columnFilterMenu, 'hide');
      component.clearFilter();
      expect(component.columnFilterMenu.hide).toHaveBeenCalled();
    });

    it('should not call hide when hideOnClear is false', () => {
      jest.spyOn(component.columnFilterMenu, 'hide');
      component.clearFilter();
      expect(component.columnFilterMenu.hide).not.toHaveBeenCalled();
    });
  });

  describe('clearFilterValues', () => {
    it('should reset filter constraint value to null', () => {
      ((mockTable as any).filters.name as FilterMetadata[])[0].value = 'test';
      component.clearFilterValues();
      expect(
        ((mockTable as any).filters.name as FilterMetadata[])[0].value
      ).toBeNull();
    });

    it('should set isFilterApplied to false', () => {
      component.isFilterApplied = true;
      component.clearFilterValues();
      expect(component.isFilterApplied).toBe(false);
    });
  });

  describe('applyFilter', () => {
    it('should call _filter', () => {
      component.applyFilter();
      expect(jest.mocked(mockTable._filter)).toHaveBeenCalled();
    });

    it('should call columnFilterMenu.hide', () => {
      jest.spyOn(component.columnFilterMenu, 'hide');
      component.applyFilter();
      expect(component.columnFilterMenu.hide).toHaveBeenCalled();
    });
  });

  describe('onMenuShown / onMenuHidden', () => {
    it('should set isMenuOpen to true on menu shown', () => {
      component.onMenuShown();
      expect(component.isMenuOpen).toBe(true);
    });

    it('should add class to parent element on menu shown', () => {
      component.onMenuShown();
      expect(
        component.elementRef.nativeElement.parentElement?.classList.contains(
          'cps-table-col-filter-menu-open'
        )
      ).toBe(true);
    });

    it('should set isMenuOpen to false on menu hidden', () => {
      component.onMenuShown();
      component.onMenuHidden();
      expect(component.isMenuOpen).toBe(false);
    });

    it('should remove class from parent element on menu hidden', () => {
      component.onMenuShown();
      component.onMenuHidden();
      expect(
        component.elementRef.nativeElement.parentElement?.classList.contains(
          'cps-table-col-filter-menu-open'
        )
      ).toBe(false);
    });
  });

  describe('onBeforeMenuHidden', () => {
    it('should reset filter constraint when filter is not applied', () => {
      ((mockTable as any).filters.name as FilterMetadata[])[0].value = 'test';
      component.onBeforeMenuHidden();
      expect(
        ((mockTable as any).filters.name as FilterMetadata[])[0].value
      ).toBeNull();
    });

    it('should not reset filter when filter is applied', () => {
      component.isFilterApplied = true;
      ((mockTable as any).filters.name as FilterMetadata[])[0].value = 'test';
      component.onBeforeMenuHidden();
      expect(
        ((mockTable as any).filters.name as FilterMetadata[])[0].value
      ).toBe('test');
    });
  });

  describe('_updateFilterApplied (via onFilter)', () => {
    it('should set isFilterApplied to true when any constraint value is not blank', () => {
      jest.mocked(mockTable.isFilterBlank).mockReturnValue(false);
      onFilterEmitter.emit({
        filters: { name: [{ value: 'test', matchMode: 'contains' }] }
      });
      expect(component.isFilterApplied).toBe(true);
    });

    it('should set isFilterApplied to false when all constraint values are blank', () => {
      jest.mocked(mockTable.isFilterBlank).mockReturnValue(true);
      onFilterEmitter.emit({
        filters: { name: [{ value: '', matchMode: 'contains' }] }
      });
      expect(component.isFilterApplied).toBe(false);
    });

    it('should set isFilterApplied to false when field is not in filters', () => {
      onFilterEmitter.emit({ filters: {} });
      expect(component.isFilterApplied).toBe(false);
    });

    it('should handle non-array (single) filter metadata', () => {
      jest.mocked(mockTable.isFilterBlank).mockReturnValue(false);
      onFilterEmitter.emit({
        filters: { name: { value: 'test', matchMode: 'contains' } }
      });
      expect(component.isFilterApplied).toBe(true);
    });
  });

  describe('onClick', () => {
    it('should stop event propagation', () => {
      const event = { stopPropagation: jest.fn() } as unknown as MouseEvent;
      component.onClick(event);
      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('template', () => {
    it('should render the filter menu button', () => {
      expect(
        fixture.nativeElement.querySelector(
          'button.cps-table-col-filter-menu-button'
        )
      ).toBeTruthy();
    });

    it('should set aria-label to "Open filter menu" when filter is not applied', () => {
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector(
        'button.cps-table-col-filter-menu-button'
      );
      expect(btn.getAttribute('aria-label')).toBe('Open filter menu');
    });

    it('should set aria-label to "Filter applied, open filter menu" when filter is applied', () => {
      component.isFilterApplied = true;
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector(
        'button.cps-table-col-filter-menu-button'
      );
      expect(btn.getAttribute('aria-label')).toBe(
        'Filter applied, open filter menu'
      );
    });

    it('should set aria-expanded to false when menu is closed', () => {
      const btn = fixture.nativeElement.querySelector(
        'button.cps-table-col-filter-menu-button'
      );
      expect(btn.getAttribute('aria-expanded')).toBe('false');
    });

    it('should set aria-expanded to true when menu is open', () => {
      component.onMenuShown();
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector(
        'button.cps-table-col-filter-menu-button'
      );
      expect(btn.getAttribute('aria-expanded')).toBe('true');
    });

    it('should add active class to button when filter is applied', () => {
      component.isFilterApplied = true;
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector(
        'button.cps-table-col-filter-menu-button'
      );
      expect(
        btn.classList.contains('cps-table-col-filter-menu-button-active')
      ).toBe(true);
    });
  });
});
