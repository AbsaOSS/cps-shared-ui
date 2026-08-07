import {
  Component,
  ElementRef,
  EventEmitter,
  HostAttributeToken,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild,
  type SimpleChanges
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Paginator, PaginatorModule } from 'primeng/paginator';
import { CpsSelectComponent } from '../cps-select/cps-select.component';
import { getCSSColor } from '../../utils/colors-utils/colors-utils';
import { FormsModule } from '@angular/forms';
import { isEqual } from 'lodash-es';

const DEFAULT_ROWS_PER_PAGE = [5, 10, 25, 50];

/**
 * CpsPaginatorComponent is a generic component to display content in paged format.
 * @group Components
 */
@Component({
  selector: 'cps-paginator',
  imports: [PaginatorModule, CpsSelectComponent, FormsModule],
  templateUrl: './cps-paginator.component.html',
  styleUrls: ['./cps-paginator.component.scss'],
  host: {
    role: 'navigation',
    '[attr.aria-label]': 'computedAriaLabel',
    '(keydown)': 'onKeydown($event)'
  }
})
export class CpsPaginatorComponent implements OnInit, OnChanges {
  /**
   * Zero-relative number of the first row to be displayed.
   * @group Props
   */
  @Input() first = 0;

  /**
   * Rows count to display per page.
   * @group Props
   */
  @Input() rows = 0;

  /**
   * Number of total records.
   * @group Props
   */
  @Input() totalRecords = 0;

  /**
   * Array of integer values to display inside rows per page dropdown.
   * @group Props
   */
  @Input() rowsPerPageOptions: number[] = [];

  /**
   * Determines whether to show it even there is only one page.
   * @group Props
   */
  @Input() alwaysShow = true;

  /**
   * Color of paginator background.
   * @group Props
   */
  @Input() backgroundColor = 'transparent';

  /**
   * Determines whether to reset page index when the number of rows per page changes.
   * @group Props
   */
  @Input() resetPageOnRowsChange = false;

  /**
   * Accessible label for the paginator component.
   * Falls back to "Pagination" when empty value is provided.
   * @group Props
   * @default Pagination
   */
  @Input() ariaLabel = '';

  /**
   * Callback to invoke when page changes, the event object contains information about the new state.
   * @param {any} any - page changed.
   * @group Emits
   */
  @Output() pageChanged = new EventEmitter<any>();

  @ViewChild('paginator')
  paginator!: Paginator;

  cvtBackgroundColor = '';
  computedAriaLabel = '';
  paginatorPt = {
    first: { 'aria-disabled': null as string | null, tabindex: 0 }
  };

  rowOptions: { label: string; value: number }[] = [];
  private _currentRowsPerPageOptions: number[] = [];

  private readonly _document = inject(DOCUMENT);
  private readonly _elementRef = inject(ElementRef);
  private readonly _staticAriaLabel: string | null = inject(
    new HostAttributeToken('aria-label'),
    { optional: true }
  );

  ngOnInit(): void {
    this.cvtBackgroundColor = getCSSColor(this.backgroundColor, this._document);
    this.paginatorPt = this._buildPaginatorPt();
    this._syncRows();
    this._updateAriaLabel();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.backgroundColor && !changes.backgroundColor.firstChange) {
      this.cvtBackgroundColor = getCSSColor(
        this.backgroundColor,
        this._document
      );
    }
    if (changes.first || changes.totalRecords) {
      this.paginatorPt = this._buildPaginatorPt();
    }
    if (
      (changes.rows && !changes.rows.firstChange) ||
      (changes.rowsPerPageOptions && !changes.rowsPerPageOptions.firstChange)
    ) {
      this._syncRows();
    }
    if (changes.ariaLabel && !changes.ariaLabel.firstChange) {
      this._updateAriaLabel();
    }
  }

  private _syncRows(): void {
    const opts =
      this.rowsPerPageOptions.length > 0
        ? this.rowsPerPageOptions
        : DEFAULT_ROWS_PER_PAGE;

    if (this.rows && !opts.includes(this.rows)) {
      throw new Error('rowsPerPageOptions must include rows');
    }
    this.rows = this.rows || opts[0];

    if (!isEqual(opts, this._currentRowsPerPageOptions)) {
      this._currentRowsPerPageOptions = opts;
      this.rowOptions = opts.map((v) => ({ label: '' + v, value: v }));
    }
  }

  private _updateAriaLabel(): void {
    this.computedAriaLabel =
      this.ariaLabel?.trim() || this._staticAriaLabel?.trim() || 'Pagination';
  }

  private _buildPaginatorPt() {
    const firstDisabled = this.first === 0 || this.totalRecords === 0;
    return {
      first: {
        'aria-disabled': firstDisabled ? 'true' : null,
        tabindex: firstDisabled ? -1 : 0
      }
    };
  }

  onPageChange(event: any) {
    this.first = event.first;
    this.rows = event.rows;
    this.paginatorPt = this._buildPaginatorPt();
    this.pageChanged.emit(event);

    const activeEl = this._document.activeElement as HTMLElement | null;
    const atFirst = this.paginator.isFirstPage();
    const atLast = this.paginator.isLastPage();
    if (
      (atFirst &&
        (activeEl?.classList.contains('p-paginator-first') ||
          activeEl?.classList.contains('p-paginator-prev'))) ||
      (atLast &&
        (activeEl?.classList.contains('p-paginator-last') ||
          activeEl?.classList.contains('p-paginator-next')))
    ) {
      setTimeout(() => this._focusSelectedPageButton());
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

    const target = event.target as HTMLElement;
    if (!target.classList.contains('p-paginator-page')) return;

    event.preventDefault();

    const pageButtons = this._getPageButtons();
    const currentIndex = pageButtons.indexOf(target as HTMLButtonElement);
    const delta = event.key === 'ArrowRight' ? 1 : -1;
    const targetIndex = currentIndex + delta;

    if (targetIndex >= 0 && targetIndex < pageButtons.length) {
      pageButtons[targetIndex].focus();
      pageButtons[targetIndex].click();
    } else {
      const focusedPageNum = this.paginator.pageLinks![currentIndex];
      const atBoundary =
        delta > 0
          ? focusedPageNum >= this.paginator.getPageCount()
          : focusedPageNum <= 1;
      if (!atBoundary) {
        this.paginator.changePage(focusedPageNum - 1 + delta);
        setTimeout(() => this._focusSelectedPageButton());
      }
    }
  }

  private _getPageButtons(): HTMLButtonElement[] {
    return Array.from(
      this._elementRef.nativeElement.querySelectorAll('.p-paginator-page')
    ) as HTMLButtonElement[];
  }

  private _focusSelectedPageButton(): void {
    const selected = this._elementRef.nativeElement.querySelector(
      '.p-paginator-page[aria-current="page"]'
    ) as HTMLButtonElement | null;
    selected?.focus();
  }

  onRowsPerPageChange(rows: number) {
    if (this.resetPageOnRowsChange) {
      this.first = 0;
      this.paginator.first = 0;
      this.paginatorPt = this._buildPaginatorPt();
    }
    this.paginator.rows = rows;
    this.paginator.changePage(this.paginator.getPage());
  }
}
