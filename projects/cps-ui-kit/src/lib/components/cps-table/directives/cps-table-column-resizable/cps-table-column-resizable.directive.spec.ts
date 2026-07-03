import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ResizableColumn, Table, TableStyle } from 'primeng/table';
import { BaseComponent } from 'primeng/basecomponent';
import { CPS_ROOT_FONT_SIZE_SERVICE } from '../../../../services/cps-root-font-size/cps-root-font-size.service';
import { CpsTableColumnResizableDirective } from './cps-table-column-resizable.directive';

@Component({
  template: `<table>
    <thead>
      <tr>
        <th cpsTColResizable [cpsTColResizableDisabled]="disabled">
          <span>Name</span>
        </th>
      </tr>
    </thead>
  </table>`,
  imports: [CpsTableColumnResizableDirective]
})
class TestHostComponent {
  @ViewChild(CpsTableColumnResizableDirective)
  directive!: CpsTableColumnResizableDirective;

  disabled: boolean | undefined = undefined;
}

function buildMockTable() {
  return {
    _cpsResizeCellsPatched: false,
    _cpsResizeIndicatorPatched: false,
    resizeTableCells: jest.fn(),
    onColumnResize: jest.fn(),
    columnResizeMode: 'expand',
    tableViewChild: { nativeElement: document.createElement('table') },
    el: { nativeElement: document.createElement('div') },
    resizeColumnElement: null as HTMLElement | null,
    resizeHelperViewChild: null as null | { nativeElement: HTMLElement },
    _initialColWidths: null as number | null,
    _totalTableWidth: jest.fn().mockReturnValue(1000),
    setResizeTableWidth: jest.fn(),
    onColResize: { emit: jest.fn() }
  };
}

describe('CpsTableColumnResizableDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let directive: CpsTableColumnResizableDirective;
  let mockTable: ReturnType<typeof buildMockTable>;
  let mockResizer: HTMLSpanElement;

  beforeEach(async () => {
    mockResizer = document.createElement('span');
    mockTable = buildMockTable();

    jest
      .spyOn(BaseComponent.prototype, 'ngOnInit')
      .mockImplementation(() => {});

    jest
      .spyOn(ResizableColumn.prototype, 'onAfterViewInit')
      .mockImplementation(function (this: ResizableColumn) {
        (this as { resizer: HTMLSpanElement | undefined }).resizer =
          mockResizer;
      });

    jest
      .spyOn(ResizableColumn.prototype, 'onDestroy')
      .mockImplementation(() => {});

    await TestBed.configureTestingModule({
      imports: [TestHostComponent, NoopAnimationsModule],
      providers: [
        { provide: Table, useValue: mockTable },
        {
          provide: TableStyle,
          useValue: { name: 'table', loadCSS: () => {}, getCSS: () => '' }
        },
        {
          provide: CPS_ROOT_FONT_SIZE_SERVICE,
          useValue: { fontSize: () => 16 }
        }
      ]
    }).compileComponents();

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

  describe('cpsTColResizableDisabled input', () => {
    it('should default pResizableColumnDisabled to undefined', () => {
      expect(directive.pResizableColumnDisabled).toBeUndefined();
    });

    it('should set pResizableColumnDisabled via cpsTColResizableDisabled alias', () => {
      host.disabled = true;
      fixture.detectChanges();
      expect(directive.pResizableColumnDisabled).toBe(true);
    });

    it('should pass false through the alias', () => {
      host.disabled = false;
      fixture.detectChanges();
      expect(directive.pResizableColumnDisabled).toBe(false);
    });
  });

  describe('isEnabled', () => {
    it('should return true when pResizableColumnDisabled is undefined', () => {
      expect(directive.isEnabled()).toBe(true);
    });

    it('should return true when pResizableColumnDisabled is false', () => {
      host.disabled = false;
      fixture.detectChanges();
      expect(directive.isEnabled()).toBe(true);
    });

    it('should return false when pResizableColumnDisabled is true', () => {
      host.disabled = true;
      fixture.detectChanges();
      expect(directive.isEnabled()).toBe(false);
    });
  });

  describe('onAfterViewInit — resizer ARIA attributes (when enabled)', () => {
    it('should set tabindex 0 on resizer', () => {
      expect(mockResizer.getAttribute('tabindex')).toBe('0');
    });

    it('should set role separator on resizer', () => {
      expect(mockResizer.getAttribute('role')).toBe('separator');
    });

    it('should set aria-orientation vertical on resizer', () => {
      expect(mockResizer.getAttribute('aria-orientation')).toBe('vertical');
    });

    it('should set aria-label on resizer', () => {
      expect(mockResizer.getAttribute('aria-label')).toBe('Column resizer');
    });

    it('should set aria-valuenow 0 on resizer', () => {
      expect(mockResizer.getAttribute('aria-valuenow')).toBe('0');
    });

    it('should set aria-valuetext on resizer', () => {
      expect(mockResizer.getAttribute('aria-valuetext')).toContain(
        'arrow keys'
      );
    });
  });

  describe('onAfterViewInit — ARIA skipped when disabled', () => {
    it('should not set ARIA on resizer when pResizableColumnDisabled is true', () => {
      const freshResizer = document.createElement('span');
      jest
        .spyOn(ResizableColumn.prototype, 'onAfterViewInit')
        .mockImplementation(function (this: ResizableColumn) {
          (this as { resizer: HTMLSpanElement | undefined }).resizer =
            freshResizer;
        });

      const f = TestBed.createComponent(TestHostComponent);
      f.componentInstance.disabled = true;
      f.detectChanges();

      expect(freshResizer.getAttribute('tabindex')).toBeNull();
      expect(freshResizer.getAttribute('role')).toBeNull();
    });
  });

  describe('onAfterViewInit — resizeTableCells patch', () => {
    it('should set _cpsResizeCellsPatched to true', () => {
      expect(mockTable._cpsResizeCellsPatched).toBe(true);
    });

    it('should replace table.resizeTableCells with a patched function', () => {
      expect(mockTable.resizeTableCells).not.toBeInstanceOf(
        jest.fn().constructor
      );
      expect(typeof mockTable.resizeTableCells).toBe('function');
    });

    it('should not re-patch when a second directive is created on the same table', () => {
      const patchedRef = mockTable.resizeTableCells;
      const f2 = TestBed.createComponent(TestHostComponent);
      f2.detectChanges();
      expect(mockTable.resizeTableCells).toBe(patchedRef);
    });
  });

  describe('_onResizerKeydown', () => {
    let th: HTMLElement;

    beforeEach(() => {
      th = fixture.debugElement.query(By.css('th'))
        .nativeElement as HTMLElement;
      Object.defineProperty(th, 'offsetWidth', {
        value: 100,
        configurable: true,
        writable: true
      });
      jest.spyOn(mockTable, 'resizeTableCells');
    });

    it('should ignore non-arrow keys and not call preventDefault', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      jest.spyOn(event, 'preventDefault');
      (directive as any)._onResizerKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(mockTable.resizeTableCells).not.toHaveBeenCalled();
    });

    it('should call preventDefault on ArrowRight', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      jest.spyOn(event, 'preventDefault');
      (directive as any)._onResizerKeydown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should call preventDefault on ArrowLeft', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      jest.spyOn(event, 'preventDefault');
      (directive as any)._onResizerKeydown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should use 10px step on ArrowRight (expand mode)', () => {
      mockTable.columnResizeMode = 'expand';
      (directive as any)._onResizerKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowRight' })
      );
      expect(mockTable.resizeTableCells).toHaveBeenCalledWith(110, null);
    });

    it('should use 10px step on ArrowLeft (expand mode)', () => {
      mockTable.columnResizeMode = 'expand';
      (directive as any)._onResizerKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowLeft' })
      );
      expect(mockTable.resizeTableCells).toHaveBeenCalledWith(90, null);
    });

    it('should use 50px step when Shift is held', () => {
      mockTable.columnResizeMode = 'expand';
      (directive as any)._onResizerKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true })
      );
      expect(mockTable.resizeTableCells).toHaveBeenCalledWith(150, null);
    });

    it('should not resize if newColumnWidth < 15', () => {
      mockTable.columnResizeMode = 'expand';
      Object.defineProperty(th, 'offsetWidth', {
        value: 20,
        configurable: true,
        writable: true
      });
      // ArrowLeft + Shift: delta = -50, newColumnWidth = 20 - 50 = -30 < 15
      (directive as any)._onResizerKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', shiftKey: true })
      );
      expect(mockTable.resizeTableCells).not.toHaveBeenCalled();
    });

    it('should set table.resizeColumnElement to the th', () => {
      mockTable.columnResizeMode = 'expand';
      (directive as any)._onResizerKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowRight' })
      );
      expect(mockTable.resizeColumnElement).toBe(th);
    });

    it('should call setResizeTableWidth with px value in expand mode', () => {
      mockTable.columnResizeMode = 'expand';
      Object.defineProperty(
        mockTable.tableViewChild.nativeElement,
        'offsetWidth',
        {
          value: 800,
          configurable: true
        }
      );
      (directive as any)._onResizerKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowRight' })
      );
      // tableWidth = 800 + 10 = 810px
      expect(mockTable.setResizeTableWidth).toHaveBeenCalledWith('810px');
    });

    it('should emit onColResize with element and delta', () => {
      mockTable.columnResizeMode = 'expand';
      (directive as any)._onResizerKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowRight' })
      );
      expect(mockTable.onColResize.emit).toHaveBeenCalledWith({
        element: th,
        delta: 10
      });
    });

    it('should not call resizeTableCells in fit mode when there is no next sibling', () => {
      mockTable.columnResizeMode = 'fit';
      (directive as any)._onResizerKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowRight' })
      );
      expect(mockTable.resizeTableCells).not.toHaveBeenCalled();
    });

    it('should call resizeTableCells with both widths in fit mode', () => {
      mockTable.columnResizeMode = 'fit';
      const nextTh = document.createElement('th');
      Object.defineProperty(nextTh, 'offsetWidth', {
        value: 200,
        configurable: true
      });
      th.after(nextTh);

      (directive as any)._onResizerKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowRight' })
      );
      // delta = 10; newColumnWidth = 110; nextColumnWidth = 200 - 10 = 190
      expect(mockTable.resizeTableCells).toHaveBeenCalledWith(110, 190);

      nextTh.remove();
    });

    it('should not resize in fit mode when nextColumnWidth < 15', () => {
      mockTable.columnResizeMode = 'fit';
      const nextTh = document.createElement('th');
      Object.defineProperty(nextTh, 'offsetWidth', {
        value: 20,
        configurable: true
      });
      th.after(nextTh);

      // ArrowRight + Shift: delta = 50; nextColumnWidth = 20 - 50 = -30 < 15
      (directive as any)._onResizerKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true })
      );
      expect(mockTable.resizeTableCells).not.toHaveBeenCalled();

      nextTh.remove();
    });
  });

  describe('onDestroy', () => {
    it('should call super.onDestroy', () => {
      directive.onDestroy();
      expect(ResizableColumn.prototype.onDestroy).toHaveBeenCalled();
    });

    it('should clear all listener references', () => {
      directive.onDestroy();
      expect((directive as any)._keydownListener).toBeUndefined();
      expect((directive as any)._focusListener).toBeUndefined();
      expect((directive as any)._blurListener).toBeUndefined();
      expect((directive as any)._thScrollListener).toBeUndefined();
    });
  });
});
