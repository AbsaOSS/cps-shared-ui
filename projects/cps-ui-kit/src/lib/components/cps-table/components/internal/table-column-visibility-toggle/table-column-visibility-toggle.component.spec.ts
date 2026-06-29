import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TableColumnVisibilityToggleComponent } from './table-column-visibility-toggle.component';

const COLUMNS = [
  { header: 'Name', field: 'name' },
  { header: 'Age', field: 'age' },
  { header: 'City', field: 'city' }
];

describe('TableColumnVisibilityToggleComponent', () => {
  let component: TableColumnVisibilityToggleComponent;
  let fixture: ComponentFixture<TableColumnVisibilityToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableColumnVisibilityToggleComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(TableColumnVisibilityToggleComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('selectedColumns', [...COLUMNS]);
    fixture.detectChanges();
  });

  afterEach(() => {
    document.body
      .querySelectorAll('.cps-menu-container')
      .forEach((el) => el.remove());
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('default values', () => {
    it('should default columns to empty array', () => {
      const f = TestBed.createComponent(TableColumnVisibilityToggleComponent);
      expect(f.componentInstance.columns()).toEqual([]);
    });

    it('should default selectedColumns to empty array', () => {
      const f = TestBed.createComponent(TableColumnVisibilityToggleComponent);
      expect(f.componentInstance.selectedColumns()).toEqual([]);
    });

    it('should default disabled to false', () => {
      expect(component.disabled()).toBe(false);
    });

    it('should default colHeaderName to "header"', () => {
      expect(component.colHeaderName()).toBe('header');
    });

    it('should default isMenuOpen to false', () => {
      expect(component.isMenuOpen()).toBe(false);
    });

    it('should default highlightedIndex to -1', () => {
      expect(component.highlightedIndex()).toBe(-1);
    });

    it('should default activeDescendantId to null', () => {
      expect(component.activeDescendantId()).toBeNull();
    });
  });

  describe('host class bindings', () => {
    it('should always have cps-table-tbar-coltoggle-btn class', () => {
      expect(
        fixture.nativeElement.classList.contains('cps-table-tbar-coltoggle-btn')
      ).toBe(true);
    });
  });

  describe('toggle button', () => {
    it('should render the toggle button', () => {
      const btn = fixture.nativeElement.querySelector(
        'button.cps-table-tbar-icon-btn'
      );
      expect(btn).toBeTruthy();
    });

    it('should set aria-label on the toggle button', () => {
      const btn = fixture.nativeElement.querySelector('button');
      expect(btn.getAttribute('aria-label')).toBe('Toggle column visibility');
    });

    it('should set aria-expanded to false when menu is closed', () => {
      const btn = fixture.nativeElement.querySelector('button');
      expect(btn.getAttribute('aria-expanded')).toBe('false');
    });

    it('should set aria-expanded to true when menu is open', () => {
      component.onMenuShown();
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button');
      expect(btn.getAttribute('aria-expanded')).toBe('true');
    });

    it('should be disabled when disabled input is true', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button');
      expect(btn.disabled).toBe(true);
    });
  });

  describe('listbox (when menu is open)', () => {
    beforeEach(() => {
      fixture.nativeElement.querySelector('button').click();
      fixture.detectChanges();
    });

    it('should render the listbox container in document.body', () => {
      expect(document.body.querySelector('[role="listbox"]')).toBeTruthy();
    });

    it('should render "Show all columns" option first', () => {
      const firstOption = document.body.querySelector('[role="option"]');
      expect(firstOption?.textContent).toContain('Show all columns');
    });

    it('should render one option per column plus the select-all', () => {
      const options = document.body.querySelectorAll('[role="option"]');
      expect(options.length).toBe(COLUMNS.length + 1);
    });

    it('should display column headers using colHeaderName', () => {
      const labels = document.body.querySelectorAll(
        '.cps-table-coltoggle-menu-item-label'
      );
      expect(labels[1].textContent?.trim()).toBe('Name');
      expect(labels[2].textContent?.trim()).toBe('Age');
      expect(labels[3].textContent?.trim()).toBe('City');
    });

    it('should mark select-all as allselected when all columns are selected', () => {
      const selectAll = document.body.querySelector('.select-all-option');
      expect(selectAll?.classList.contains('allselected')).toBe(true);
    });

    it('should not mark select-all as allselected when some columns are hidden', () => {
      fixture.componentRef.setInput('selectedColumns', [COLUMNS[0]]);
      fixture.detectChanges();
      const selectAll = document.body.querySelector('.select-all-option');
      expect(selectAll?.classList.contains('allselected')).toBe(false);
    });

    it('should mark selected column items with selected class', () => {
      fixture.componentRef.setInput('selectedColumns', [COLUMNS[0]]);
      fixture.detectChanges();
      const options = document.body.querySelectorAll(
        '.cps-table-coltoggle-menu-item:not(.select-all-option)'
      );
      expect(options[0].classList.contains('selected')).toBe(true);
      expect(options[1].classList.contains('selected')).toBe(false);
    });

    it('should apply highlighten class to the highlighted item', () => {
      component.highlightedIndex.set(1);
      fixture.detectChanges();
      const options = document.body.querySelectorAll('[role="option"]');
      expect(options[1].classList.contains('highlighten')).toBe(true);
      expect(options[0].classList.contains('highlighten')).toBe(false);
    });
  });

  describe('activeDescendantId', () => {
    it('should return null when no item is highlighted', () => {
      expect(component.activeDescendantId()).toBeNull();
    });

    it('should return the id for the highlighted item', () => {
      component.highlightedIndex.set(2);
      expect(component.activeDescendantId()).toBe(
        `${component.listboxId}-opt-2`
      );
    });
  });

  describe('isColumnSelected', () => {
    it('should return true for a column in selectedColumns', () => {
      expect(component.isColumnSelected(COLUMNS[0])).toBe(true);
    });

    it('should return false for a column not in selectedColumns', () => {
      fixture.componentRef.setInput('selectedColumns', [COLUMNS[0]]);
      expect(component.isColumnSelected(COLUMNS[1])).toBe(false);
    });
  });

  describe('toggleAllColumns', () => {
    it('should emit all columns when currently partially selected', () => {
      fixture.componentRef.setInput('selectedColumns', [COLUMNS[0]]);
      jest.spyOn(component.selectedColumnsChange, 'emit');
      component.toggleAllColumns();
      expect(component.selectedColumnsChange.emit).toHaveBeenCalledWith(
        COLUMNS
      );
    });

    it('should emit empty array when all columns are already selected', () => {
      jest.spyOn(component.selectedColumnsChange, 'emit');
      component.toggleAllColumns();
      expect(component.selectedColumnsChange.emit).toHaveBeenCalledWith([]);
    });
  });

  describe('onSelectColumn', () => {
    it('should emit selection with column added when not already selected', () => {
      fixture.componentRef.setInput('selectedColumns', [COLUMNS[0]]);
      jest.spyOn(component.selectedColumnsChange, 'emit');
      component.onSelectColumn(COLUMNS[1]);
      expect(component.selectedColumnsChange.emit).toHaveBeenCalledWith([
        COLUMNS[0],
        COLUMNS[1]
      ]);
    });

    it('should emit selection with column removed when already selected', () => {
      jest.spyOn(component.selectedColumnsChange, 'emit');
      component.onSelectColumn(COLUMNS[1]);
      expect(component.selectedColumnsChange.emit).toHaveBeenCalledWith([
        COLUMNS[0],
        COLUMNS[2]
      ]);
    });

    it('should preserve column order from columns input', () => {
      fixture.componentRef.setInput('selectedColumns', [COLUMNS[2]]);
      jest.spyOn(component.selectedColumnsChange, 'emit');
      component.onSelectColumn(COLUMNS[0]);
      expect(component.selectedColumnsChange.emit).toHaveBeenCalledWith([
        COLUMNS[0],
        COLUMNS[2]
      ]);
    });
  });

  describe('onMenuShown / onMenuHidden', () => {
    it('should set isMenuOpen to true and reset highlightedIndex on menu shown', () => {
      component.highlightedIndex.set(2);
      component.onMenuShown();
      expect(component.isMenuOpen()).toBe(true);
      expect(component.highlightedIndex()).toBe(-1);
    });

    it('should set isMenuOpen to false and reset highlightedIndex on menu hidden', () => {
      component.onMenuShown();
      component.highlightedIndex.set(1);
      component.onMenuHidden();
      expect(component.isMenuOpen()).toBe(false);
      expect(component.highlightedIndex()).toBe(-1);
    });
  });

  describe('onKeydown - arrow navigation', () => {
    const down = () =>
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
    const up = () =>
      new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true });

    it('should move to first item on ArrowDown from -1', () => {
      component.onKeydown(down());
      expect(component.highlightedIndex()).toBe(0);
    });

    it('should increment highlightedIndex on ArrowDown', () => {
      component.highlightedIndex.set(0);
      component.onKeydown(down());
      expect(component.highlightedIndex()).toBe(1);
    });

    it('should wrap to first item on ArrowDown from last', () => {
      component.highlightedIndex.set(COLUMNS.length);
      component.onKeydown(down());
      expect(component.highlightedIndex()).toBe(0);
    });

    it('should move to last item on ArrowUp from -1', () => {
      component.onKeydown(up());
      expect(component.highlightedIndex()).toBe(COLUMNS.length);
    });

    it('should decrement highlightedIndex on ArrowUp', () => {
      component.highlightedIndex.set(2);
      component.onKeydown(up());
      expect(component.highlightedIndex()).toBe(1);
    });

    it('should wrap to last item on ArrowUp from 0', () => {
      component.highlightedIndex.set(0);
      component.onKeydown(up());
      expect(component.highlightedIndex()).toBe(COLUMNS.length);
    });
  });

  describe('onKeydown - Enter / Space', () => {
    it('should call toggleAllColumns when Enter is pressed at index 0', () => {
      component.highlightedIndex.set(0);
      jest.spyOn(component, 'toggleAllColumns');
      component.onKeydown(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      );
      expect(component.toggleAllColumns).toHaveBeenCalled();
    });

    it('should call onSelectColumn for the correct column when Space is pressed', () => {
      component.highlightedIndex.set(2);
      jest.spyOn(component, 'onSelectColumn');
      component.onKeydown(
        new KeyboardEvent('keydown', { key: ' ', bubbles: true })
      );
      expect(component.onSelectColumn).toHaveBeenCalledWith(COLUMNS[1]);
    });

    it('should do nothing when Enter is pressed with no item highlighted', () => {
      jest.spyOn(component, 'toggleAllColumns');
      jest.spyOn(component, 'onSelectColumn');
      component.onKeydown(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      );
      expect(component.toggleAllColumns).not.toHaveBeenCalled();
      expect(component.onSelectColumn).not.toHaveBeenCalled();
    });
  });

  describe('onToggle', () => {
    it('should not open menu when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      component.onToggle(new MouseEvent('click'));
      expect(component.isMenuOpen()).toBe(false);
    });
  });
});
