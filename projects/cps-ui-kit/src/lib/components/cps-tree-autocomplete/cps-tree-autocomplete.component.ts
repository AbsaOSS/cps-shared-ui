import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  ViewChild
} from '@angular/core';
import { FormsModule, NgControl } from '@angular/forms';
import { CpsIconComponent } from '../cps-icon/cps-icon.component';
import { CpsChipComponent } from '../cps-chip/cps-chip.component';
import { CpsProgressLinearComponent } from '../cps-progress-linear/cps-progress-linear.component';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { find, isEqual } from 'lodash-es';
import { Tree, TreeModule } from 'primeng/tree';
import { TreeNode } from 'primeng/api';
import { CpsTreeDropdownBaseComponent } from '../../base_components/cps-tree-dropdown-base.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TreeModule,
    ClickOutsideDirective,
    CpsIconComponent,
    CpsChipComponent,
    CpsProgressLinearComponent
  ],
  selector: 'cps-tree-autocomplete',
  templateUrl: './cps-tree-autocomplete.component.html',
  styleUrls: ['./cps-tree-autocomplete.component.scss']
})
export class CpsTreeAutocompleteComponent
  extends CpsTreeDropdownBaseComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @Input() emptyMessage = 'No results found';

  @ViewChild('treeAutocompleteContainer')
  treeAutocompleteContainer!: ElementRef;

  @ViewChild('treeAutocompleteList') treeAutocompleteList!: Tree;

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
    this.treeContainer = this.treeAutocompleteContainer;
    this.treeList = this.treeAutocompleteList;
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

  onClickOutside(dd: HTMLElement) {
    this._closeAndClear(dd);
  }

  onBoxClick() {
    if (!this.multiple) {
      this.activeSingle = true;
      this.inputText = this._getValueLabel();
      this.treeAutocompleteList.resetFilter();
    }
    this.focus();
    this.optionFocused = false;
  }

  onContainerKeyDown(event: any, dd: HTMLElement) {
    const code = event.keyCode;
    // escape
    if (code === 27) {
      this._closeAndClear(dd);
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

  override clear(dd: HTMLElement, event: any): void {
    super.clear(dd, event);

    this._clearInput();
    setTimeout(() => {
      this.focusInput();
    }, 0);
  }

  focusInput() {
    this.treeAutocompleteContainer?.nativeElement
      ?.querySelector('input')
      ?.focus();
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
      this.toggleOptions(this.treeAutocompleteContainer?.nativeElement, true);
    }
    this.backspaceClickedOnce = false;
    const searchVal = (event?.target?.value || '').toLowerCase();

    if (!searchVal) this.treeAutocompleteList.resetFilter();
    else this.treeAutocompleteList._filter(searchVal);
  }

  private _getValueLabel() {
    return this.treeSelection?.label || '';
  }

  private _clearInput() {
    this.treeAutocompleteList.resetFilter();
    this.inputText = '';
    this.activeSingle = false;
  }

  private _closeAndClear(dd: HTMLElement) {
    this._clearInput();
    this.toggleOptions(dd, false);
  }

  private _confirmInput(searchVal: string) {
    if (!this.isOpened) return;
    searchVal = searchVal.toLowerCase();
    if (!searchVal) {
      if (this.multiple) return;
      this.treeSelection = undefined;
      this.updateValue(undefined);
      this._closeAndClear(this.treeAutocompleteContainer?.nativeElement);
      return;
    }

    const found = this.treeAutocompleteList?.serializedValue?.find(
      (sv: any) => sv?.node?.label?.toLowerCase() === searchVal
    );
    if (found) {
      this._select(found.node);
      this.toggleOptions(
        this.treeAutocompleteContainer?.nativeElement,
        this.multiple
      );
    } else {
      if (!this.multiple) {
        this.inputText = this._getValueLabel();
        this.treeAutocompleteList.resetFilter();
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
