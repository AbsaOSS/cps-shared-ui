import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  TTResizableColumn,
  TreeTable,
  TreeTableStyle
} from '../../../../primeng-temp/treetable/public_api';
import { BaseComponent } from '../../../../primeng-temp/basecomponent/public_api';
import { CPS_ROOT_FONT_SIZE_SERVICE } from '../../../../services/cps-root-font-size/cps-root-font-size.service';
import { CpsTreeTableColumnResizableDirective } from './cps-tree-table-column-resizable.directive';

@Component({
  template: `<table>
    <thead>
      <tr>
        <th cpsTTColResizable [cpsTTColResizableDisabled]="disabled">
          <span>Name</span>
        </th>
      </tr>
    </thead>
  </table>`,
  imports: [CpsTreeTableColumnResizableDirective]
})
class TestHostComponent {
  @ViewChild(CpsTreeTableColumnResizableDirective)
  directive!: CpsTreeTableColumnResizableDirective;

  disabled: boolean | undefined = undefined;
}

function buildMockTreeTable() {
  return {
    _cpsResizeColGroupPatched: false,
    _cpsResizeIndicatorPatched: false,
    _cpsResizeBeginPatched: false,
    resizeColGroup: jest.fn(),
    onColumnResize: jest.fn(),
    onColumnResizeBegin: jest.fn(),
    columnResizeMode: 'expand' as string,
    scrollable: false,
    tableViewChild: {
      nativeElement: document.createElement('table')
    } as { nativeElement: HTMLElement },
    el: { nativeElement: document.createElement('div') },
    resizeHelperViewChild: null as null | { nativeElement: HTMLElement },
    findParentScrollableView: jest.fn(),
    onColResize: { emit: jest.fn() }
  };
}

describe('CpsTreeTableColumnResizableDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let directive: CpsTreeTableColumnResizableDirective;
  let mockTreeTable: ReturnType<typeof buildMockTreeTable>;
  let mockResizer: HTMLSpanElement;

  beforeEach(async () => {
    mockResizer = document.createElement('span');
    mockTreeTable = buildMockTreeTable();

    jest
      .spyOn(BaseComponent.prototype, 'ngOnInit')
      .mockImplementation(() => {});

    jest
      .spyOn(TTResizableColumn.prototype, 'onAfterViewInit')
      .mockImplementation(function (this: TTResizableColumn) {
        (this as { resizer: HTMLSpanElement | undefined }).resizer =
          mockResizer;
      });

    jest
      .spyOn(TTResizableColumn.prototype, 'onDestroy')
      .mockImplementation(() => {});

    await TestBed.configureTestingModule({
      imports: [TestHostComponent, NoopAnimationsModule],
      providers: [
        { provide: TreeTable, useValue: mockTreeTable },
        {
          provide: TreeTableStyle,
          useValue: { name: 'treetable', loadCSS: () => {}, getCSS: () => '' }
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

  describe('cpsTTColResizableDisabled input', () => {
    it('should default ttResizableColumnDisabled to undefined', () => {
      expect(directive.ttResizableColumnDisabled).toBeUndefined();
    });

    it('should set ttResizableColumnDisabled via cpsTTColResizableDisabled alias', () => {
      host.disabled = true;
      fixture.detectChanges();
      expect(directive.ttResizableColumnDisabled).toBe(true);
    });

    it('should pass false through the alias', () => {
      host.disabled = false;
      fixture.detectChanges();
      expect(directive.ttResizableColumnDisabled).toBe(false);
    });
  });

  describe('isEnabled', () => {
    it('should return true when ttResizableColumnDisabled is undefined', () => {
      expect(directive.isEnabled()).toBe(true);
    });

    it('should return true when ttResizableColumnDisabled is false', () => {
      host.disabled = false;
      fixture.detectChanges();
      expect(directive.isEnabled()).toBe(true);
    });

    it('should return false when ttResizableColumnDisabled is true', () => {
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
    it('should not set ARIA on resizer when ttResizableColumnDisabled is true', () => {
      const freshResizer = document.createElement('span');
      jest
        .spyOn(TTResizableColumn.prototype, 'onAfterViewInit')
        .mockImplementation(function (this: TTResizableColumn) {
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

  describe('onAfterViewInit — resizeColGroup patch', () => {
    it('should set _cpsResizeColGroupPatched to true', () => {
      expect(mockTreeTable._cpsResizeColGroupPatched).toBe(true);
    });

    it('should replace tt.resizeColGroup with a custom function', () => {
      expect(typeof mockTreeTable.resizeColGroup).toBe('function');
      expect(mockTreeTable.resizeColGroup).not.toBeInstanceOf(
        jest.fn().constructor
      );
    });

    it('should not re-patch when a second directive is created on the same tree table', () => {
      const patchedRef = mockTreeTable.resizeColGroup;
      const f2 = TestBed.createComponent(TestHostComponent);
      f2.detectChanges();
      expect(mockTreeTable.resizeColGroup).toBe(patchedRef);
    });

    it('should return early if table argument is null', () => {
      expect(() =>
        mockTreeTable.resizeColGroup(null as any, 0, 100, null)
      ).not.toThrow();
    });

    it('should return early if table has no COLGROUP first child', () => {
      const table = document.createElement('table');
      table.appendChild(document.createElement('thead'));
      expect(() =>
        mockTreeTable.resizeColGroup(table, 0, 100, null)
      ).not.toThrow();
    });

    it('should set col width and tableLayout when table has COLGROUP', () => {
      const table = document.createElement('table');
      const colGroup = document.createElement('colgroup');
      const col0 = document.createElement('col');
      const col1 = document.createElement('col');
      colGroup.appendChild(col0);
      colGroup.appendChild(col1);
      table.appendChild(colGroup);

      mockTreeTable.resizeColGroup(table, 0, 120, null);

      expect(col0.style.width).toBe('120px');
      expect(table.style.tableLayout).toBe('fixed');
    });

    it('should set next col width when nextColumnWidth is provided', () => {
      const table = document.createElement('table');
      const colGroup = document.createElement('colgroup');
      const col0 = document.createElement('col');
      const col1 = document.createElement('col');
      colGroup.appendChild(col0);
      colGroup.appendChild(col1);
      table.appendChild(colGroup);

      mockTreeTable.resizeColGroup(table, 0, 120, 80);

      expect(col0.style.width).toBe('120px');
      expect(col1.style.width).toBe('80px');
    });
  });

  describe('onAfterViewInit — onColumnResize patch', () => {
    it('should set _cpsResizeIndicatorPatched to true', () => {
      expect(mockTreeTable._cpsResizeIndicatorPatched).toBe(true);
    });

    it('should call the original onColumnResize when invoked', () => {
      const wrapped = mockTreeTable.onColumnResize as (e: MouseEvent) => void;
      const event = new MouseEvent('mousemove');
      expect(() => wrapped.call(mockTreeTable, event)).not.toThrow();
    });

    it('should not throw when resizeHelperViewChild is null', () => {
      mockTreeTable.resizeHelperViewChild = null;
      expect(() =>
        (mockTreeTable.onColumnResize as (e: MouseEvent) => void).call(
          mockTreeTable,
          new MouseEvent('mousemove')
        )
      ).not.toThrow();
    });
  });

  describe('onAfterViewInit — onColumnResizeBegin patch', () => {
    it('should set _cpsResizeBeginPatched to true', () => {
      expect(mockTreeTable._cpsResizeBeginPatched).toBe(true);
    });

    it('should call both onColumnResizeBegin original and the patched onColumnResize', () => {
      const originalResizeBeginSpy = jest.fn();
      const originalResizeSpy = jest.fn();

      const freshMock = buildMockTreeTable();
      freshMock.onColumnResizeBegin = originalResizeBeginSpy;
      freshMock.onColumnResize = originalResizeSpy;

      const originalBegin = freshMock.onColumnResizeBegin.bind(freshMock);
      (
        freshMock as { onColumnResizeBegin: (e: MouseEvent) => void }
      ).onColumnResizeBegin = (event: MouseEvent) => {
        originalBegin(event);
        freshMock.onColumnResize(event);
      };
      freshMock.onColumnResize = originalResizeSpy;

      const event = new MouseEvent('mousedown');
      freshMock.onColumnResizeBegin(event);

      expect(originalResizeBeginSpy).toHaveBeenCalledWith(event);
      expect(originalResizeSpy).toHaveBeenCalledWith(event);
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
    });

    it('should ignore non-arrow keys and not call preventDefault', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      jest.spyOn(event, 'preventDefault');
      (directive as any)._onResizerKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
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

    it('should set th.style.width in expand mode (ArrowRight, small step)', () => {
      mockTreeTable.columnResizeMode = 'expand';
      mockTreeTable.scrollable = false;
      (directive as any)._onResizerKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowRight' })
      );
      // delta = Math.round(1 * 0.625 * 16) = 10; newColumnWidth = 100 + 10 = 110
      expect(th.style.width).toBe('110px');
    });

    it('should set th.style.width in expand mode (ArrowLeft, small step)', () => {
      mockTreeTable.columnResizeMode = 'expand';
      mockTreeTable.scrollable = false;
      (directive as any)._onResizerKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowLeft' })
      );
      // delta = -10; newColumnWidth = 90
      expect(th.style.width).toBe('90px');
    });

    it('should use large step when Shift is held', () => {
      mockTreeTable.columnResizeMode = 'expand';
      mockTreeTable.scrollable = false;
      (directive as any)._onResizerKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true })
      );
      // delta = Math.round(1 * 3.125 * 16) = 50; newColumnWidth = 150
      expect(th.style.width).toBe('150px');
    });

    it('should adjust tableEl.style.width in expand mode', () => {
      mockTreeTable.columnResizeMode = 'expand';
      mockTreeTable.scrollable = false;
      const tableEl = mockTreeTable.tableViewChild.nativeElement;
      Object.defineProperty(tableEl, 'offsetWidth', {
        value: 800,
        configurable: true
      });
      (directive as any)._onResizerKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowRight' })
      );
      // tableWidth = 800 + 10 = 810
      expect(tableEl.style.width).toBe('810px');
    });

    it('should not resize when newColumnWidth < 15', () => {
      mockTreeTable.columnResizeMode = 'expand';
      mockTreeTable.scrollable = false;
      Object.defineProperty(th, 'offsetWidth', {
        value: 20,
        configurable: true,
        writable: true
      });
      // ArrowLeft + Shift: delta = -50; newColumnWidth = 20 - 50 = -30 < 15
      (directive as any)._onResizerKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', shiftKey: true })
      );
      expect(th.style.width).toBe('');
    });

    it('should emit onColResize with element and delta in expand mode', () => {
      mockTreeTable.columnResizeMode = 'expand';
      mockTreeTable.scrollable = false;
      (directive as any)._onResizerKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowRight' })
      );
      expect(mockTreeTable.onColResize.emit).toHaveBeenCalledWith({
        element: th,
        delta: 10
      });
    });

    it('should not resize in fit mode when there is no next sibling', () => {
      mockTreeTable.columnResizeMode = 'fit';
      mockTreeTable.scrollable = false;
      (directive as any)._onResizerKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowRight' })
      );
      expect(th.style.width).toBe('');
      expect(mockTreeTable.onColResize.emit).not.toHaveBeenCalled();
    });

    it('should set both th and nextTh widths in fit mode', () => {
      mockTreeTable.columnResizeMode = 'fit';
      mockTreeTable.scrollable = false;
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
      expect(th.style.width).toBe('110px');
      expect(nextTh.style.width).toBe('190px');

      nextTh.remove();
    });

    it('should not resize in fit mode when nextColumnWidth < 15', () => {
      mockTreeTable.columnResizeMode = 'fit';
      mockTreeTable.scrollable = false;
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
      expect(th.style.width).toBe('');
      expect(nextTh.style.width).toBe('');

      nextTh.remove();
    });

    it('should emit onColResize in fit mode', () => {
      mockTreeTable.columnResizeMode = 'fit';
      mockTreeTable.scrollable = false;
      const nextTh = document.createElement('th');
      Object.defineProperty(nextTh, 'offsetWidth', {
        value: 200,
        configurable: true
      });
      th.after(nextTh);

      (directive as any)._onResizerKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowRight' })
      );
      expect(mockTreeTable.onColResize.emit).toHaveBeenCalledWith({
        element: th,
        delta: 10
      });

      nextTh.remove();
    });
  });

  describe('onDestroy', () => {
    it('should call super.onDestroy', () => {
      directive.onDestroy();
      expect(TTResizableColumn.prototype.onDestroy).toHaveBeenCalled();
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
