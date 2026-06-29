import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { isEqual } from 'lodash-es';
import { CpsMenuComponent } from '../../../../cps-menu/cps-menu.component';
import { CpsIconComponent } from '../../../../cps-icon/cps-icon.component';
import { generateUniqueId } from '../../../../../utils/internal/accessibility-utils';

/**
 * TableColumnVisibilityToggleComponent is an internal component that renders
 * the "Toggle column visibility" button and its listbox dropdown.
 */
@Component({
  selector: 'table-column-visibility-toggle',
  imports: [CommonModule, CpsMenuComponent, CpsIconComponent],
  templateUrl: './table-column-visibility-toggle.component.html',
  styleUrls: ['./table-column-visibility-toggle.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'cps-table-tbar-coltoggle-btn'
  }
})
export class TableColumnVisibilityToggleComponent {
  columns = input<{ [key: string]: any }[]>([]);
  selectedColumns = input<{ [key: string]: any }[]>([]);
  disabled = input(false);
  colHeaderName = input('header');
  selectedColumnsChange = output<{ [key: string]: any }[]>();

  private _menu = viewChild.required<CpsMenuComponent>('menu');
  private _listbox = viewChild.required<ElementRef<HTMLElement>>('listbox');

  isMenuOpen = signal(false);
  highlightedIndex = signal(-1);
  readonly listboxId = generateUniqueId('cps-table-coltoggle');

  activeDescendantId = computed(() => {
    const i = this.highlightedIndex();
    return i < 0 ? null : `${this.listboxId}-opt-${i}`;
  });

  onToggle(event: any): void {
    if (this.disabled()) return;
    this._menu().toggle(event);
  }

  onMenuShown(): void {
    this.isMenuOpen.set(true);
    this.highlightedIndex.set(-1);
    setTimeout(() => this._listbox().nativeElement?.focus());
  }

  onMenuHidden(): void {
    this.isMenuOpen.set(false);
    this.highlightedIndex.set(-1);
  }

  onKeydown(event: KeyboardEvent): void {
    const total = 1 + this.columns().length;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlightedIndex.update((i) =>
          i === -1 || i === total - 1 ? 0 : i + 1
        );
        this._scrollIntoView();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.highlightedIndex.update((i) => (i < 1 ? total - 1 : i - 1));
        this._scrollIntoView();
        break;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const idx = this.highlightedIndex();
        if (idx === 0) {
          this.toggleAllColumns();
        } else if (idx > 0) {
          this.onSelectColumn(this.columns()[idx - 1]);
        }
        break;
      }
      case 'Escape':
        this._menu().hide();
        break;
    }
  }

  toggleAllColumns(): void {
    const cols =
      this.selectedColumns().length < this.columns().length
        ? this.columns()
        : [];
    this.selectedColumnsChange.emit(cols);
  }

  isColumnSelected(col: any): boolean {
    return this.selectedColumns().some((item) => isEqual(item, col));
  }

  onSelectColumn(col: any): void {
    let res: any[] = [];
    if (this.isColumnSelected(col)) {
      res = this.selectedColumns().filter((v: any) => !isEqual(v, col));
    } else {
      this.columns().forEach((o) => {
        if (
          this.selectedColumns().some((v: any) => isEqual(v, o)) ||
          isEqual(col, o)
        ) {
          res.push(o);
        }
      });
    }
    this.selectedColumnsChange.emit(res);
  }

  private _scrollIntoView(): void {
    const activeId = this.activeDescendantId();
    if (!activeId) return;
    const listbox = this._listbox().nativeElement;
    const item = listbox?.querySelector(`#${activeId}`) as HTMLElement | null;
    if (!listbox || !item) return;
    const itemBottom = item.offsetTop + item.offsetHeight;
    if (itemBottom > listbox.scrollTop + listbox.clientHeight) {
      listbox.scrollTop = itemBottom - listbox.clientHeight;
    } else if (item.offsetTop < listbox.scrollTop) {
      listbox.scrollTop = item.offsetTop;
    }
  }
}
