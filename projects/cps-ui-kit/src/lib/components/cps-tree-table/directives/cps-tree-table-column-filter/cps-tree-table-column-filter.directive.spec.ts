import { Component, EventEmitter, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TreeTable } from 'primeng/treetable';
import {
  CpsColumnFilterMatchMode,
  CpsColumnFilterType
} from '../../../cps-table/cps-column-filter-types';
import { CpsTreeTableColumnFilterDirective } from './cps-tree-table-column-filter.directive';

@Component({
  template: `<th
    [cpsTTColFilter]="field"
    [filterType]="filterType"
    [filterPersistent]="filterPersistent"
    [filterShowClearButton]="filterShowClearButton"
    [filterShowApplyButton]="filterShowApplyButton"
    [filterShowCloseButton]="filterShowCloseButton"
    [filterShowMatchModes]="filterShowMatchModes"
    [filterMatchModes]="filterMatchModes"
    [filterShowOperator]="filterShowOperator"
    [filterHeaderTitle]="filterHeaderTitle"
    [filterHideOnClear]="filterHideOnClear"
    [filterCategoryOptions]="filterCategoryOptions"
    [filterAsButtonToggle]="filterAsButtonToggle"
    [filterSingleSelection]="filterSingleSelection"
    [filterPlaceholder]="filterPlaceholder">
    <span>Header</span>
  </th>`,
  imports: [CpsTreeTableColumnFilterDirective]
})
class TestHostComponent {
  @ViewChild(CpsTreeTableColumnFilterDirective)
  directive!: CpsTreeTableColumnFilterDirective;

  field: string | undefined = 'name';
  filterType: CpsColumnFilterType = 'text';
  filterPersistent = false;
  filterShowClearButton = true;
  filterShowApplyButton = true;
  filterShowCloseButton = false;
  filterShowMatchModes = true;
  filterMatchModes: CpsColumnFilterMatchMode[] = [];
  filterShowOperator = true;
  filterHeaderTitle = '';
  filterHideOnClear = false;
  filterCategoryOptions: string[] = [];
  filterAsButtonToggle = false;
  filterSingleSelection = false;
  filterPlaceholder = '';
}

describe('CpsTreeTableColumnFilterDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let directive: CpsTreeTableColumnFilterDirective;
  let mockTreeTable: TreeTable;

  beforeEach(async () => {
    mockTreeTable = Object.create(TreeTable.prototype) as TreeTable;
    (mockTreeTable as { ngOnDestroy: () => void }).ngOnDestroy = jest.fn();
    (mockTreeTable as { filters: Record<string, unknown> }).filters = {};
    (mockTreeTable as { onFilter: EventEmitter<unknown> }).onFilter =
      new EventEmitter();
    jest.spyOn(mockTreeTable, 'isFilterBlank').mockReturnValue(false);
    jest.spyOn(mockTreeTable, '_filter').mockImplementation(() => {});

    await TestBed.configureTestingModule({
      imports: [TestHostComponent, NoopAnimationsModule],
      providers: [{ provide: TreeTable, useValue: mockTreeTable }]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    directive = host.directive;
  });

  afterEach(() => {
    document.body
      .querySelectorAll('.cps-menu-container, .cps-overlay-panel')
      .forEach((el) => el.remove());
  });

  it('should create', () => {
    expect(directive).toBeTruthy();
  });

  it('should create a TableColumnFilterComponent in filterCompRef', () => {
    expect(directive.filterCompRef).toBeTruthy();
    expect(directive.filterCompRef.instance).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should insert the filter component element into the host th', () => {
      const th = fixture.debugElement.query(By.css('th'))
        .nativeElement as HTMLElement;
      const filterEl = directive.filterCompRef.location.nativeElement;
      expect(th.contains(filterEl)).toBe(true);
    });

    it('should place the filter element after the first child', () => {
      const th = fixture.debugElement.query(By.css('th'))
        .nativeElement as HTMLElement;
      const filterEl = directive.filterCompRef.location.nativeElement;
      const firstChild = th.firstChild as HTMLElement;
      expect(firstChild.nextSibling).toBe(filterEl);
    });
  });

  describe('ngOnChanges', () => {
    it('should forward field to filter component', () => {
      jest
        .spyOn(directive.filterCompRef, 'setInput')
        .mockImplementation(() => {});
      host.field = 'age';
      fixture.detectChanges();
      expect(directive.filterCompRef.setInput).toHaveBeenCalledWith(
        'field',
        'age'
      );
    });

    it('should forward filterType as type', () => {
      jest
        .spyOn(directive.filterCompRef, 'setInput')
        .mockImplementation(() => {});
      host.filterType = 'number';
      fixture.detectChanges();
      expect(directive.filterCompRef.setInput).toHaveBeenCalledWith(
        'type',
        'number'
      );
    });

    it('should forward filterPersistent as persistent', () => {
      jest
        .spyOn(directive.filterCompRef, 'setInput')
        .mockImplementation(() => {});
      host.filterPersistent = true;
      fixture.detectChanges();
      expect(directive.filterCompRef.setInput).toHaveBeenCalledWith(
        'persistent',
        true
      );
    });

    it('should forward filterShowClearButton as showClearButton', () => {
      jest
        .spyOn(directive.filterCompRef, 'setInput')
        .mockImplementation(() => {});
      host.filterShowClearButton = false;
      fixture.detectChanges();
      expect(directive.filterCompRef.setInput).toHaveBeenCalledWith(
        'showClearButton',
        false
      );
    });

    it('should forward filterShowApplyButton as showApplyButton', () => {
      jest
        .spyOn(directive.filterCompRef, 'setInput')
        .mockImplementation(() => {});
      host.filterShowApplyButton = false;
      fixture.detectChanges();
      expect(directive.filterCompRef.setInput).toHaveBeenCalledWith(
        'showApplyButton',
        false
      );
    });

    it('should forward filterShowCloseButton as showCloseButton', () => {
      jest
        .spyOn(directive.filterCompRef, 'setInput')
        .mockImplementation(() => {});
      host.filterShowCloseButton = true;
      fixture.detectChanges();
      expect(directive.filterCompRef.setInput).toHaveBeenCalledWith(
        'showCloseButton',
        true
      );
    });

    it('should forward filterShowMatchModes as showMatchModes', () => {
      jest
        .spyOn(directive.filterCompRef, 'setInput')
        .mockImplementation(() => {});
      host.filterShowMatchModes = false;
      fixture.detectChanges();
      expect(directive.filterCompRef.setInput).toHaveBeenCalledWith(
        'showMatchModes',
        false
      );
    });

    it('should forward filterMatchModes as matchModes', () => {
      const modes: CpsColumnFilterMatchMode[] = [
        CpsColumnFilterMatchMode.CONTAINS,
        CpsColumnFilterMatchMode.EQUALS
      ];
      jest
        .spyOn(directive.filterCompRef, 'setInput')
        .mockImplementation(() => {});
      host.filterMatchModes = modes;
      fixture.detectChanges();
      expect(directive.filterCompRef.setInput).toHaveBeenCalledWith(
        'matchModes',
        modes
      );
    });

    it('should forward filterShowOperator as showOperator', () => {
      jest
        .spyOn(directive.filterCompRef, 'setInput')
        .mockImplementation(() => {});
      host.filterShowOperator = false;
      fixture.detectChanges();
      expect(directive.filterCompRef.setInput).toHaveBeenCalledWith(
        'showOperator',
        false
      );
    });

    it('should always forward maxConstraints as 1', () => {
      jest
        .spyOn(directive.filterCompRef, 'setInput')
        .mockImplementation(() => {});
      host.field = 'trigger';
      fixture.detectChanges();
      expect(directive.filterCompRef.setInput).toHaveBeenCalledWith(
        'maxConstraints',
        1
      );
    });

    it('should forward filterHeaderTitle as headerTitle', () => {
      jest
        .spyOn(directive.filterCompRef, 'setInput')
        .mockImplementation(() => {});
      host.filterHeaderTitle = 'My Filter';
      fixture.detectChanges();
      expect(directive.filterCompRef.setInput).toHaveBeenCalledWith(
        'headerTitle',
        'My Filter'
      );
    });

    it('should forward filterHideOnClear as hideOnClear', () => {
      jest
        .spyOn(directive.filterCompRef, 'setInput')
        .mockImplementation(() => {});
      host.filterHideOnClear = true;
      fixture.detectChanges();
      expect(directive.filterCompRef.setInput).toHaveBeenCalledWith(
        'hideOnClear',
        true
      );
    });

    it('should forward filterCategoryOptions as categoryOptions', () => {
      const opts = ['Active', 'Inactive'];
      jest
        .spyOn(directive.filterCompRef, 'setInput')
        .mockImplementation(() => {});
      host.filterCategoryOptions = opts;
      fixture.detectChanges();
      expect(directive.filterCompRef.setInput).toHaveBeenCalledWith(
        'categoryOptions',
        opts
      );
    });

    it('should forward filterAsButtonToggle as asButtonToggle', () => {
      jest
        .spyOn(directive.filterCompRef, 'setInput')
        .mockImplementation(() => {});
      host.filterAsButtonToggle = true;
      fixture.detectChanges();
      expect(directive.filterCompRef.setInput).toHaveBeenCalledWith(
        'asButtonToggle',
        true
      );
    });

    it('should forward filterSingleSelection as singleSelection', () => {
      jest
        .spyOn(directive.filterCompRef, 'setInput')
        .mockImplementation(() => {});
      host.filterSingleSelection = true;
      fixture.detectChanges();
      expect(directive.filterCompRef.setInput).toHaveBeenCalledWith(
        'singleSelection',
        true
      );
    });

    it('should forward explicit filterPlaceholder as placeholder', () => {
      jest
        .spyOn(directive.filterCompRef, 'setInput')
        .mockImplementation(() => {});
      host.filterPlaceholder = 'Search here';
      fixture.detectChanges();
      expect(directive.filterCompRef.setInput).toHaveBeenCalledWith(
        'placeholder',
        'Search here'
      );
    });
  });

  describe('placeholder defaults (_getDefaultPlaceholder)', () => {
    it('should use "Please enter" for text type when filterPlaceholder is empty', () => {
      jest
        .spyOn(directive.filterCompRef, 'setInput')
        .mockImplementation(() => {});
      host.filterType = 'text';
      host.filterPlaceholder = '';
      host.field = 'trigger';
      fixture.detectChanges();
      expect(directive.filterCompRef.setInput).toHaveBeenCalledWith(
        'placeholder',
        'Please enter'
      );
    });

    it('should use "Enter value" for number type', () => {
      jest
        .spyOn(directive.filterCompRef, 'setInput')
        .mockImplementation(() => {});
      host.filterType = 'number';
      host.filterPlaceholder = '';
      fixture.detectChanges();
      expect(directive.filterCompRef.setInput).toHaveBeenCalledWith(
        'placeholder',
        'Enter value'
      );
    });

    it('should use "Select date" for date type', () => {
      jest
        .spyOn(directive.filterCompRef, 'setInput')
        .mockImplementation(() => {});
      host.filterType = 'date';
      host.filterPlaceholder = '';
      fixture.detectChanges();
      expect(directive.filterCompRef.setInput).toHaveBeenCalledWith(
        'placeholder',
        'Select date'
      );
    });

    it('should use "Please select" for category type', () => {
      jest
        .spyOn(directive.filterCompRef, 'setInput')
        .mockImplementation(() => {});
      host.filterType = 'category';
      host.filterPlaceholder = '';
      fixture.detectChanges();
      expect(directive.filterCompRef.setInput).toHaveBeenCalledWith(
        'placeholder',
        'Please select'
      );
    });

    it('should use empty string for boolean type (no default)', () => {
      jest
        .spyOn(directive.filterCompRef, 'setInput')
        .mockImplementation(() => {});
      host.filterType = 'boolean';
      host.filterPlaceholder = '';
      fixture.detectChanges();
      expect(directive.filterCompRef.setInput).toHaveBeenCalledWith(
        'placeholder',
        ''
      );
    });

    it('should prefer explicit filterPlaceholder over the default', () => {
      jest
        .spyOn(directive.filterCompRef, 'setInput')
        .mockImplementation(() => {});
      host.filterType = 'text';
      host.filterPlaceholder = 'Custom';
      fixture.detectChanges();
      expect(directive.filterCompRef.setInput).toHaveBeenCalledWith(
        'placeholder',
        'Custom'
      );
    });
  });

  describe('hideFilter', () => {
    it('should delegate to filterCompRef.instance.hide', () => {
      jest.spyOn(directive.filterCompRef.instance, 'hide');
      directive.hideFilter();
      expect(directive.filterCompRef.instance.hide).toHaveBeenCalled();
    });
  });

  describe('clearFilter', () => {
    it('should delegate to filterCompRef.instance.clearFilter', () => {
      jest.spyOn(directive.filterCompRef.instance, 'clearFilter');
      directive.clearFilter();
      expect(directive.filterCompRef.instance.clearFilter).toHaveBeenCalled();
    });
  });

  describe('clearFilterValues', () => {
    it('should delegate to filterCompRef.instance.clearFilterValues', () => {
      jest.spyOn(directive.filterCompRef.instance, 'clearFilterValues');
      directive.clearFilterValues();
      expect(
        directive.filterCompRef.instance.clearFilterValues
      ).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should call filterCompRef.destroy', () => {
      jest.spyOn(directive.filterCompRef, 'destroy');
      directive.ngOnDestroy();
      expect(directive.filterCompRef.destroy).toHaveBeenCalled();
    });
  });
});
