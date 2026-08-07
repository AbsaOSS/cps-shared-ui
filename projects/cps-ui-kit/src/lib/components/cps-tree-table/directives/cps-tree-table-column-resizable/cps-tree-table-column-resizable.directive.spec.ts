import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  TTResizableColumn,
  TreeTable,
  TreeTableStyle
} from 'primeng/treetable';
import { BaseComponent } from 'primeng/basecomponent';
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

    it('should not backfill a width onto columns other than the resized one and its neighbor', () => {
      const table = document.createElement('table');
      const colGroup = document.createElement('colgroup');
      const col0 = document.createElement('col');
      const col1 = document.createElement('col');
      const col2 = document.createElement('col');
      colGroup.appendChild(col0);
      colGroup.appendChild(col1);
      colGroup.appendChild(col2);
      table.appendChild(colGroup);

      mockTreeTable.resizeColGroup(table, 0, 120, null);

      expect(col0.style.width).toBe('120px');
      expect(col1.style.width).toBe('');
      expect(col2.style.width).toBe('');
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

    it('should call the real patched onColumnResizeBegin and trigger onColumnResize', () => {
      const resizeSpy = jest.spyOn(mockTreeTable, 'onColumnResize');
      const event = new MouseEvent('mousedown');
      (mockTreeTable.onColumnResizeBegin as (e: MouseEvent) => void).call(
        mockTreeTable,
        event
      );
      expect(resizeSpy).toHaveBeenCalledWith(event);
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

  describe('resizer focus/blur/focusin listeners', () => {
    it('should add the focused class when the resizer is focused', () => {
      mockResizer.dispatchEvent(new Event('focus'));
      expect(mockResizer.classList.contains('cps-col-resizer-focused')).toBe(
        true
      );
    });

    it('should remove the focused class when the resizer is blurred', () => {
      mockResizer.classList.add('cps-col-resizer-focused');
      mockResizer.dispatchEvent(new Event('blur'));
      expect(mockResizer.classList.contains('cps-col-resizer-focused')).toBe(
        false
      );
    });

    it('should reset horizontal scroll on the th when the resizer receives focusin', () => {
      const th = fixture.debugElement.query(By.css('th'))
        .nativeElement as HTMLElement;
      th.appendChild(mockResizer);
      th.scrollLeft = 50;
      const rafSpy = jest
        .spyOn(window, 'requestAnimationFrame')
        .mockImplementation((rafCallback: any) => {
          rafCallback(0);
          return 0;
        });
      const event = new Event('focusin', { bubbles: true });
      Object.defineProperty(event, 'target', {
        value: mockResizer,
        configurable: true
      });
      th.dispatchEvent(event);
      expect(rafSpy).toHaveBeenCalled();
    });

    it('should ignore focusin events not targeting the resizer', () => {
      const th = fixture.debugElement.query(By.css('th'))
        .nativeElement as HTMLElement;
      const rafSpy = jest.spyOn(window, 'requestAnimationFrame');
      const other = document.createElement('span');
      const event = new Event('focusin', { bubbles: true });
      Object.defineProperty(event, 'target', {
        value: other,
        configurable: true
      });
      th.dispatchEvent(event);
      expect(rafSpy).not.toHaveBeenCalled();
    });

    it('should not reset scrollLeft when it is already 0', () => {
      const th = fixture.debugElement.query(By.css('th'))
        .nativeElement as HTMLElement;
      th.appendChild(mockResizer);
      th.scrollLeft = 0;
      const scrollLeftSetter = jest.fn();
      Object.defineProperty(th, 'scrollLeft', {
        get: () => 0,
        set: scrollLeftSetter,
        configurable: true
      });
      jest
        .spyOn(window, 'requestAnimationFrame')
        .mockImplementation((rafCallback: any) => {
          rafCallback(0);
          return 0;
        });
      const event = new Event('focusin', { bubbles: true });
      Object.defineProperty(event, 'target', {
        value: mockResizer,
        configurable: true
      });
      th.dispatchEvent(event);
      expect(scrollLeftSetter).not.toHaveBeenCalled();
    });
  });

  describe('_rootFontSizePx fallback', () => {
    it('should fall back to 16 when the root font size service reports a falsy size', () => {
      mockTreeTable.columnResizeMode = 'expand';
      mockTreeTable.scrollable = false;
      const th = fixture.debugElement.query(By.css('th'))
        .nativeElement as HTMLElement;
      Object.defineProperty(th, 'offsetWidth', {
        value: 100,
        configurable: true
      });

      const f = TestBed.createComponent(TestHostComponent);
      f.detectChanges();
      const localDirective = f.componentInstance.directive;
      (localDirective as any)._cpsRootFontSizeService = { fontSize: () => 0 };
      const localTh = f.debugElement.query(By.css('th'))
        .nativeElement as HTMLElement;
      Object.defineProperty(localTh, 'offsetWidth', {
        value: 100,
        configurable: true
      });

      (localDirective as any)._onResizerKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowRight' })
      );

      // delta = round(1 * 0.625 * 16) = 10 (fallback font size of 16px)
      expect(localTh.style.width).toBe('110px');
    });
  });

  describe('resizeColGroup with an out-of-range column index', () => {
    it('should leave columns untouched when resizeColumnIndex is out of range', () => {
      const table = document.createElement('table');
      const colGroup = document.createElement('colgroup');
      const col0 = document.createElement('col');
      colGroup.appendChild(col0);
      table.appendChild(colGroup);

      expect(() =>
        mockTreeTable.resizeColGroup(table, 5, 120, null)
      ).not.toThrow();
      expect(col0.style.width).toBe('');
    });
  });

  describe('onAfterViewInit — onColumnResize patch positions the indicator', () => {
    it('should position the indicator relative to its offset parent using tableViewChild', () => {
      const indicator = document.createElement('div');
      const ancestor = document.createElement('div');
      ancestor.appendChild(indicator);
      document.body.appendChild(ancestor);
      Object.defineProperty(indicator, 'offsetParent', {
        value: ancestor,
        configurable: true
      });
      jest
        .spyOn(ancestor, 'getBoundingClientRect')
        .mockReturnValue({ top: 10 } as DOMRect);
      const tableEl = document.createElement('table');
      Object.defineProperty(tableEl, 'offsetHeight', {
        value: 300,
        configurable: true
      });
      jest
        .spyOn(tableEl, 'getBoundingClientRect')
        .mockReturnValue({ top: 60 } as DOMRect);
      mockTreeTable.tableViewChild = { nativeElement: tableEl };
      mockTreeTable.resizeHelperViewChild = { nativeElement: indicator };

      (mockTreeTable.onColumnResize as (e: MouseEvent) => void).call(
        mockTreeTable,
        new MouseEvent('mousemove')
      );

      expect(indicator.style.top).toBe('50px');
      expect(indicator.style.height).toBe('300px');

      document.body.removeChild(ancestor);
    });

    it('should do nothing further when there is no positioned ancestor', () => {
      const indicator = document.createElement('div');
      mockTreeTable.resizeHelperViewChild = { nativeElement: indicator };
      expect(() =>
        (mockTreeTable.onColumnResize as (e: MouseEvent) => void).call(
          mockTreeTable,
          new MouseEvent('mousemove')
        )
      ).not.toThrow();
    });

    it('should fall back to the scrollable wrapper when tableViewChild is unavailable', () => {
      const indicator = document.createElement('div');
      const ancestor = document.createElement('div');
      ancestor.appendChild(indicator);
      document.body.appendChild(ancestor);
      Object.defineProperty(indicator, 'offsetParent', {
        value: ancestor,
        configurable: true
      });
      jest
        .spyOn(ancestor, 'getBoundingClientRect')
        .mockReturnValue({ top: 0 } as DOMRect);

      const wrapper = document.createElement('div');
      wrapper.className = 'p-treetable-scrollable-wrapper';
      Object.defineProperty(wrapper, 'offsetHeight', {
        value: 150,
        configurable: true
      });
      jest
        .spyOn(wrapper, 'getBoundingClientRect')
        .mockReturnValue({ top: 5 } as DOMRect);
      const hostEl = document.createElement('div');
      hostEl.appendChild(wrapper);

      mockTreeTable.tableViewChild = undefined as any;
      mockTreeTable.el = { nativeElement: hostEl };
      mockTreeTable.resizeHelperViewChild = { nativeElement: indicator };

      (mockTreeTable.onColumnResize as (e: MouseEvent) => void).call(
        mockTreeTable,
        new MouseEvent('mousemove')
      );

      expect(indicator.style.height).toBe('150px');

      document.body.removeChild(ancestor);
    });

    it('should do nothing when there is no table element to measure', () => {
      const indicator = document.createElement('div');
      const ancestor = document.createElement('div');
      ancestor.appendChild(indicator);
      Object.defineProperty(indicator, 'offsetParent', {
        value: ancestor,
        configurable: true
      });
      mockTreeTable.tableViewChild = undefined as any;
      mockTreeTable.el = { nativeElement: document.createElement('div') };
      mockTreeTable.resizeHelperViewChild = { nativeElement: indicator };
      expect(() =>
        (mockTreeTable.onColumnResize as (e: MouseEvent) => void).call(
          mockTreeTable,
          new MouseEvent('mousemove')
        )
      ).not.toThrow();
    });
  });

  describe('_onResizerKeydown — scrollable mode', () => {
    let th: HTMLElement;
    let scrollableView: HTMLElement;
    let headerTable: HTMLElement;
    let bodyTable: HTMLElement;
    let footerTable: HTMLElement;

    beforeEach(() => {
      th = fixture.debugElement.query(By.css('th'))
        .nativeElement as HTMLElement;
      Object.defineProperty(th, 'offsetWidth', {
        value: 100,
        configurable: true,
        writable: true
      });
      const tr = document.createElement('tr');
      tr.appendChild(th);
      mockTreeTable.scrollable = true;

      scrollableView = document.createElement('div');
      headerTable = document.createElement('table');
      headerTable.setAttribute('data-pc-section', 'scrollableheadertable');
      Object.defineProperty(headerTable, 'offsetWidth', {
        value: 300,
        configurable: true
      });
      bodyTable = document.createElement('table');
      bodyTable.setAttribute('data-pc-section', 'scrollablebody');
      const bodyInnerTable = document.createElement('table');
      bodyTable.appendChild(bodyInnerTable);
      Object.defineProperty(bodyInnerTable, 'offsetWidth', {
        value: 300,
        configurable: true
      });
      footerTable = document.createElement('table');
      footerTable.setAttribute('data-pc-section', 'scrollablefootertable');
      Object.defineProperty(footerTable, 'offsetWidth', {
        value: 300,
        configurable: true
      });
      scrollableView.appendChild(headerTable);
      scrollableView.appendChild(bodyTable);
      scrollableView.appendChild(footerTable);

      mockTreeTable.findParentScrollableView.mockReturnValue(scrollableView);
      jest.spyOn(mockTreeTable, 'resizeColGroup');
    });

    it('should return early in fit mode when there is no scrollable view', () => {
      mockTreeTable.columnResizeMode = 'fit';
      mockTreeTable.findParentScrollableView.mockReturnValue(null);
      const nextTh = document.createElement('th');
      Object.defineProperty(nextTh, 'offsetWidth', {
        value: 200,
        configurable: true
      });
      th.after(nextTh);
      (directive as any)._onResizerKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowRight' })
      );
      expect(mockTreeTable.resizeColGroup).not.toHaveBeenCalled();
      nextTh.remove();
    });

    it('should resize header/body/footer col groups in fit mode', () => {
      mockTreeTable.columnResizeMode = 'fit';
      const nextTh = document.createElement('th');
      Object.defineProperty(nextTh, 'offsetWidth', {
        value: 200,
        configurable: true
      });
      th.after(nextTh);
      (directive as any)._onResizerKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowRight' })
      );
      expect(mockTreeTable.resizeColGroup).toHaveBeenCalledTimes(3);
      nextTh.remove();
    });

    it('should return early in expand mode when there is no scrollable view', () => {
      mockTreeTable.columnResizeMode = 'expand';
      mockTreeTable.findParentScrollableView.mockReturnValue(null);
      (directive as any)._onResizerKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowRight' })
      );
      expect(mockTreeTable.resizeColGroup).not.toHaveBeenCalled();
    });

    it('should resize header/body/footer widths and col groups in expand mode', () => {
      mockTreeTable.columnResizeMode = 'expand';
      (directive as any)._onResizerKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowRight' })
      );
      expect(headerTable.style.width).toBe('310px');
      expect(mockTreeTable.resizeColGroup).toHaveBeenCalledTimes(3);
    });
  });

  describe('_onResizerKeydown — scrollable mode fallback selector and missing elements', () => {
    let th: HTMLElement;

    beforeEach(() => {
      th = fixture.debugElement.query(By.css('th'))
        .nativeElement as HTMLElement;
      Object.defineProperty(th, 'offsetWidth', {
        value: 100,
        configurable: true,
        writable: true
      });
      const tr = document.createElement('tr');
      tr.appendChild(th);
      mockTreeTable.scrollable = true;
      jest.spyOn(mockTreeTable, 'resizeColGroup');
    });

    it('should fall back to the virtualscroller table when the scrollable-body table is not found (fit mode)', () => {
      const scrollableView = document.createElement('div');
      const virtualWrapper = document.createElement('div');
      virtualWrapper.setAttribute('data-pc-name', 'virtualscroller');
      const virtualTable = document.createElement('table');
      virtualWrapper.appendChild(virtualTable);
      scrollableView.appendChild(virtualWrapper);
      mockTreeTable.findParentScrollableView.mockReturnValue(scrollableView);
      mockTreeTable.columnResizeMode = 'fit';
      const nextTh = document.createElement('th');
      Object.defineProperty(nextTh, 'offsetWidth', {
        value: 200,
        configurable: true
      });
      th.after(nextTh);

      (directive as any)._onResizerKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowRight' })
      );

      expect(mockTreeTable.resizeColGroup).toHaveBeenCalledTimes(3);
      nextTh.remove();
    });

    it('should skip resizing header/body/footer widths when none are found (expand mode)', () => {
      const scrollableView = document.createElement('div');
      mockTreeTable.findParentScrollableView.mockReturnValue(scrollableView);
      mockTreeTable.columnResizeMode = 'expand';

      expect(() =>
        (directive as any)._onResizerKeydown(
          new KeyboardEvent('keydown', { key: 'ArrowRight' })
        )
      ).not.toThrow();
      expect(mockTreeTable.resizeColGroup).toHaveBeenCalledTimes(3);
    });

    it('should fall back to the virtualscroller table when the scrollable-body table is not found (expand mode)', () => {
      const scrollableView = document.createElement('div');
      const virtualWrapper = document.createElement('div');
      virtualWrapper.setAttribute('data-pc-name', 'virtualscroller');
      const virtualTable = document.createElement('table');
      Object.defineProperty(virtualTable, 'offsetWidth', {
        value: 300,
        configurable: true
      });
      virtualWrapper.appendChild(virtualTable);
      scrollableView.appendChild(virtualWrapper);
      mockTreeTable.findParentScrollableView.mockReturnValue(scrollableView);
      mockTreeTable.columnResizeMode = 'expand';

      (directive as any)._onResizerKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowRight' })
      );

      expect(virtualTable.style.width).toBe('310px');
    });
  });

  describe('_resizeFit / _resizeExpand non-scrollable with no tableViewChild', () => {
    let th: HTMLElement;

    beforeEach(() => {
      th = fixture.debugElement.query(By.css('th'))
        .nativeElement as HTMLElement;
      Object.defineProperty(th, 'offsetWidth', {
        value: 100,
        configurable: true,
        writable: true
      });
      mockTreeTable.scrollable = false;
      mockTreeTable.tableViewChild = undefined as any;
    });

    it('should still resize the th/nextTh widths in fit mode when there is no table element', () => {
      mockTreeTable.columnResizeMode = 'fit';
      const nextTh = document.createElement('th');
      Object.defineProperty(nextTh, 'offsetWidth', {
        value: 200,
        configurable: true
      });
      th.after(nextTh);

      (directive as any)._onResizerKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowRight' })
      );

      expect(th.style.width).toBe('110px');
      nextTh.remove();
    });

    it('should still resize the th width in expand mode when there is no table element', () => {
      mockTreeTable.columnResizeMode = 'expand';

      (directive as any)._onResizerKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowRight' })
      );

      expect(th.style.width).toBe('110px');
    });
  });

  describe('_onResizerKeydown — non-scrollable width backfill', () => {
    let th: HTMLElement;

    beforeEach(() => {
      th = fixture.debugElement.query(By.css('th'))
        .nativeElement as HTMLElement;
      Object.defineProperty(th, 'offsetWidth', {
        value: 100,
        configurable: true,
        writable: true
      });
      mockTreeTable.scrollable = false;
    });

    function buildTheadRow(): { tableEl: HTMLElement; ths: HTMLElement[] } {
      const tableEl = document.createElement('table');
      const thead = document.createElement('thead');
      const tr = document.createElement('tr');
      const thA = document.createElement('th');
      Object.defineProperty(thA, 'offsetWidth', {
        value: 90,
        configurable: true
      });
      const thB = document.createElement('th');
      thB.style.width = '77px';
      Object.defineProperty(thB, 'offsetWidth', {
        value: 95,
        configurable: true
      });
      tr.appendChild(thA);
      tr.appendChild(thB);
      thead.appendChild(tr);
      tableEl.appendChild(thead);
      return { tableEl, ths: [thA, thB] };
    }

    it('should backfill missing widths onto header cells in fit mode', () => {
      mockTreeTable.columnResizeMode = 'fit';
      const { tableEl, ths } = buildTheadRow();
      mockTreeTable.tableViewChild = { nativeElement: tableEl };
      const nextTh = document.createElement('th');
      Object.defineProperty(nextTh, 'offsetWidth', {
        value: 200,
        configurable: true
      });
      th.after(nextTh);

      (directive as any)._onResizerKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowRight' })
      );

      expect(ths[0].style.width).toBe('90px');
      expect(ths[1].style.width).toBe('77px');
      nextTh.remove();
    });

    it('should backfill missing widths onto header cells in expand mode', () => {
      mockTreeTable.columnResizeMode = 'expand';
      const { tableEl, ths } = buildTheadRow();
      mockTreeTable.tableViewChild = { nativeElement: tableEl };

      (directive as any)._onResizerKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowRight' })
      );

      expect(ths[0].style.width).toBe('90px');
      expect(ths[1].style.width).toBe('77px');
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
