import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  Optional,
  ViewChild
} from '@angular/core';
import { FormsModule, NgControl } from '@angular/forms';
import { CpsIconComponent } from '../cps-icon/cps-icon.component';
import { CpsChipComponent } from '../cps-chip/cps-chip.component';
import { CpsProgressLinearComponent } from '../cps-progress-linear/cps-progress-linear.component';
import { CpsInfoCircleComponent } from '../cps-info-circle/cps-info-circle.component';
import { isEqual } from 'lodash-es';
import { TreeModule } from 'primeng/tree';
import { TreeNode } from 'primeng/api';
import {
  CpsMenuComponent,
  CpsMenuHideReason
} from '../cps-menu/cps-menu.component';
import { CpsBaseTreeDropdownComponent } from '../internal/cps-base-tree-dropdown/cps-base-tree-dropdown.component';

/**
 * CpsTreeAutocompleteAppearanceType is used to define the border of the tree autocomplete input field.
 * @group Types
 */
export type CpsTreeAutocompleteAppearanceType =
  | 'outlined'
  | 'underlined'
  | 'borderless';

/**
 * CpsTreeAutocompleteComponent allows to choose items from hierarchical data dropdown and provides real-time suggestions when being typed.
 * @group Components
 */
@Component({
  imports: [
    NgTemplateOutlet,
    FormsModule,
    TreeModule,
    CpsIconComponent,
    CpsChipComponent,
    CpsProgressLinearComponent,
    CpsInfoCircleComponent,
    CpsMenuComponent
  ],
  selector: 'cps-tree-autocomplete',
  templateUrl: './cps-tree-autocomplete.component.html',
  styleUrls: ['./cps-tree-autocomplete.component.scss']
})
export class CpsTreeAutocompleteComponent extends CpsBaseTreeDropdownComponent {
  /**
   * Message if array of items is empty.
   * @group Props
   */
  @Input() emptyMessage = 'No results found';

  /**
   * Styling appearance of tree autocomplete, it can be 'outlined', 'underlined' or 'borderless'.
   * @group Props
   */
  @Input() appearance: CpsTreeAutocompleteAppearanceType = 'outlined';

  /**
   * Placeholder text.
   * @group Props
   */
  @Input() placeholder = 'Please enter';

  @ViewChild('treeAutocompleteInput')
  treeAutocompleteInput!: ElementRef;

  inputText = '';
  backspaceClickedOnce = false;
  activeSingle = false;
  isKeyboardFocused = false;

  private _mouseClicked = false;

  constructor(
    @Optional() public override control: NgControl,
    public override cdRef: ChangeDetectorRef
  ) {
    super(control, cdRef);
    this.isAutocomplete = true;
  }

  override onSelectNode() {
    this.backspaceClickedOnce = false;
    this._clearInput();
    super.onSelectNode();
    if (!this.multiple) {
      setTimeout(() => {
        this.focusInput();
      }, 0);
    }
  }

  override onFocus() {
    if (!this.multiple) {
      this.activeSingle = true;
      if (!this.inputText) this.inputText = this._getValueLabel();
    }
    this.isKeyboardFocused = !this._mouseClicked;
    this._mouseClicked = false;
    super.onFocus();
  }

  override onBlur() {
    this.isKeyboardFocused = false;
    if (!this.isOpened) {
      this._closeAndClear();
    }
    super.onBlur();
  }

  onBeforeOptionsHidden(reason: CpsMenuHideReason) {
    if ([CpsMenuHideReason.SCROLL, CpsMenuHideReason.RESIZE].includes(reason)) {
      this.toggleOptions(false);
      return;
    }
    this._closeAndClear();
  }

  onBoxClick() {
    this._mouseClicked = true;
    if (!this.multiple) {
      this.activeSingle = true;
      if (!this.inputText) this.inputText = this._getValueLabel();
      if (!this.isOpened) this.treeList.resetFilter();
    }
    this.focus();
    this.optionFocused = false;
  }

  onOuterDivKeyDown(event: KeyboardEvent) {
    if (event.target !== this.componentContainer?.nativeElement) return;
    this.focusInput();
    this.onContainerKeyDown(event);
  }

  onContainerKeyDown(event: KeyboardEvent) {
    const code = event.code;
    if (code === 'Tab') {
      if (this.isOpened) this._closeAndClear();
    } else if (code === 'Escape') {
      this._closeAndClear();
    } else if (code === 'ArrowDown' || code === 'ArrowUp') {
      event.preventDefault();
      this.isKeyboardFocused = true;
      const up = code === 'ArrowUp';
      if (!this.isOpened) {
        this.toggleOptions(true);
        setTimeout(() => {
          const current = this.treeList?.el?.nativeElement?.querySelector(
            '.p-tree-root-children'
          ) as HTMLElement | null;
          if (current) this.treeContainerElement = current;
          this.initArrowsNavigaton(up);
        });
      } else {
        const current = this.treeList?.el?.nativeElement?.querySelector(
          '.p-tree-root-children'
        ) as HTMLElement | null;
        if (current) this.treeContainerElement = current;
        this.optionFocused = false;
        this.navigateIntoOptions(up);
      }
    }
  }

  protected override _onOptionsClose(): void {
    this._closeAndClear();
    this.focusInput();
  }

  onInputKeyDown(event: KeyboardEvent) {
    const code = event.code;
    if (code === 'Backspace') {
      this._removeLastValue();
      event.stopPropagation();
    } else if (code === 'Enter' || code === 'NumpadEnter') {
      if (!this.isOpened) {
        event.stopPropagation();
        event.preventDefault();
        this.toggleOptions(true);
        return;
      }
      if (!this.optionFocused) {
        this._confirmInput((event.target as HTMLInputElement)?.value || '');
        event.stopPropagation();
      }
    }
  }

  onChevronClick(event: any) {
    event.preventDefault();

    if (this.isOpened) {
      this._closeAndClear();
    } else {
      this.onBoxClick();
    }
  }

  onContainerMouseDown(event: MouseEvent) {
    const input = this.treeAutocompleteInput?.nativeElement;
    if (event.target !== input) event.preventDefault();
    if (input && input !== this._document.activeElement) {
      this._mouseClicked = true;
      this.focusInput();
    }
  }

  isActive() {
    return (
      this.isOpened ||
      this._document.activeElement === this.treeAutocompleteInput?.nativeElement
    );
  }

  override remove(option: TreeNode): void {
    super.remove(option);

    this._clearInput();
    setTimeout(() => {
      this.focusInput();
    }, 0);
  }

  override clear(event?: any): void {
    super.clear(event);

    this._clearInput();
    setTimeout(() => {
      this.focusInput();
    }, 0);
  }

  focusInput() {
    this.treeAutocompleteInput?.nativeElement?.focus();
  }

  override focus() {
    super.focus();
    this.focusInput();
  }

  onFilterOptions() {
    this.recalcVirtualListHeight();
  }

  filterOptions(event: any) {
    if (!this.isOpened) {
      this.toggleOptions(true);
    }
    this.backspaceClickedOnce = false;
    this.optionFocused = false;
    const searchVal = (event?.target?.value || '').toLowerCase();

    if (!searchVal) this.treeList.resetFilter();
    else this.treeList._filter(searchVal);
  }

  private _select(option: TreeNode): void {
    function includes(array: any[], val: any): boolean {
      return array?.some((item) => isEqual(item, val)) || false;
    }

    this.backspaceClickedOnce = false;

    if (this.multiple) {
      if (includes(this.treeSelection, option)) {
        this.treeSelection = this.treeSelection.filter(
          (v: TreeNode) => !isEqual(v, option)
        );
      } else {
        this.treeSelection.push(option);
      }
    } else {
      this.treeSelection = option;
    }
    this.updateValue(this.treeSelectionToValue(this.treeSelection));

    this._clearInput();
    setTimeout(() => {
      this.focusInput();
    }, 0);
  }

  private _getValueLabel() {
    return this.treeSelection?.label || '';
  }

  private _clearInput() {
    this.treeList.resetFilter();
    this.treeList?.cd?.markForCheck();
    this.inputText = '';
    this.activeSingle = false;
    this.updateOptions();
  }

  private _closeAndClear() {
    this._clearInput();
    this.toggleOptions(false);
  }

  private _confirmInput(searchVal: string) {
    if (!this.isOpened) return;
    searchVal = searchVal.toLowerCase();
    if (!searchVal) {
      if (this.multiple) return;
      this.treeSelection = undefined;
      this.updateValue(undefined);
      this.cdRef.detectChanges();
      this._closeAndClear();
      return;
    }

    // https://github.com/primefaces/primeng/blob/v16.4.3/src/app/components/tree/tree.ts#L1125
    const found: any = this.treeList?.serializedValue?.find(
      (sv: any) => sv?.node?.label?.toLowerCase() === searchVal
    );
    if (found) {
      this._select(found.node);
      this.toggleOptions(this.multiple);
    } else {
      if (!this.multiple) {
        this.inputText = this._getValueLabel();
        this.treeList.resetFilter();
        return;
      }
    }

    this._clearInput();
  }

  private _removeLastValue() {
    if (!this.multiple || this.inputText) return;

    if (this.treeSelection?.length) {
      if (this.backspaceClickedOnce) {
        this.treeSelection = this.treeSelection.filter(
          (_v: TreeNode, index: number) =>
            index !== this.treeSelection.length - 1
        );
        this.updateValue(this.treeSelectionToValue(this.treeSelection));

        this.backspaceClickedOnce = false;
      } else this.backspaceClickedOnce = true;
    } else this.backspaceClickedOnce = false;

    setTimeout(() => {
      this.focusInput();
    }, 0);
  }
}
