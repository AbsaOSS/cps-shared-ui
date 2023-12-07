import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  Optional
} from '@angular/core';
import { FormsModule, NgControl } from '@angular/forms';
import { CpsIconComponent } from '../cps-icon/cps-icon.component';
import { CpsChipComponent } from '../cps-chip/cps-chip.component';
import { CpsProgressLinearComponent } from '../cps-progress-linear/cps-progress-linear.component';
import { CpsInfoCircleComponent } from '../cps-info-circle/cps-info-circle.component';
import { find, isEqual } from 'lodash-es';
import { TreeModule } from 'primeng/tree';
import { TreeNode } from 'primeng/api';
import { CpsMenuComponent } from '../cps-menu/cps-menu.component';
import { CpsBaseTreeDropdownComponent } from '../internal/cps-base-tree-dropdown/cps-base-tree-dropdown.component';

export type CpsTreeAutocompleteAppearanceType =
  | 'outlined'
  | 'underlined'
  | 'borderless';

/**
 * CpsTreeAutocompleteComponent allows to choose items from hierarchical data dropdown and provides real-time suggestions when being typed.
 * @group Components
 */
@Component({
  standalone: true,
  imports: [
    CommonModule,
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
export class CpsTreeAutocompleteComponent
  extends CpsBaseTreeDropdownComponent
  implements OnInit, AfterViewInit, OnDestroy
{
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

  inputText = '';
  backspaceClickedOnce = false;
  activeSingle = false;

  constructor(
    @Optional() public override control: NgControl,
    public override cdRef: ChangeDetectorRef
  ) {
    super(control, cdRef);
  }

  override ngOnInit() {
    super.ngOnInit();
  }

  override ngAfterViewInit() {
    this.isAutocomplete = true;
    super.ngAfterViewInit();
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
  }

  override onSelectNode() {
    this.backspaceClickedOnce = false;
    this._clearInput();
    super.onSelectNode();
  }

  onBeforeOptionsHidden() {
    this._closeAndClear();
  }

  onBoxClick() {
    if (!this.multiple) {
      this.activeSingle = true;
      if (!this.inputText) this.inputText = this._getValueLabel();
      if (!this.isOpened) this.treeList.resetFilter();
    }
    this.focus();
    this.optionFocused = false;
  }

  onContainerKeyDown(event: any) {
    const code = event.keyCode;
    // escape
    if (code === 27) {
      this._closeAndClear();
    }
    // click down arrow
    else if (code === 40) {
      this.initArrowsNavigaton();
    }
  }

  onInputKeyDown(event: any) {
    const code = event.keyCode;
    // backspace
    if (code === 8) {
      this._removeLastValue();
      event.stopPropagation();
    }
    // enter
    else if (code === 13) {
      if (!this.optionFocused) {
        this._confirmInput(event?.target?.value || '');
        event.stopPropagation();
      }
    }
  }

  onChevronClick(event: any) {
    event.stopPropagation();

    if (this.isOpened) {
      this._closeAndClear();
    } else {
      this.onBoxClick();
    }
  }

  override remove(option: TreeNode): void {
    super.remove(option);

    this._clearInput();
    setTimeout(() => {
      this.focusInput();
    }, 0);
  }

  private _select(option: TreeNode): void {
    function includes(array: any[], val: any): boolean {
      return array ? !!find(array, (item) => isEqual(item, val)) : false;
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

  override clear(event: any): void {
    super.clear(event);

    this._clearInput();
    setTimeout(() => {
      this.focusInput();
    }, 0);
  }

  focusInput() {
    this.componentContainer?.nativeElement?.querySelector('input')?.focus();
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
    const searchVal = (event?.target?.value || '').toLowerCase();

    if (!searchVal) this.treeList.resetFilter();
    else this.treeList._filter(searchVal);
  }

  private _getValueLabel() {
    return this.treeSelection?.label || '';
  }

  private _clearInput() {
    this.treeList.resetFilter();
    this.inputText = '';
    this.activeSingle = false;
    this.updateOptions();
    setTimeout(() => {
      this.recalcVirtualListHeight();
    });
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
      this._closeAndClear();
      return;
    }

    const found = this.treeList?.serializedValue?.find(
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
          (v: TreeNode, index: number) =>
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
