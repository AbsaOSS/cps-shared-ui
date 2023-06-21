import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  Self,
  ViewChild
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NgControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { convertSize } from '../../utils/size-utils';
import {
  CpsIconComponent,
  IconType,
  iconSizeType
} from '../cps-icon/cps-icon.component';
import { CpsChipComponent } from '../cps-chip/cps-chip.component';
import { CpsProgressLinearComponent } from '../cps-progress-linear/cps-progress-linear.component';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { find, isEqual } from 'lodash-es';
import { Tree, TreeModule } from 'primeng/tree';
import { TreeNode } from 'primeng/api';

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
  implements ControlValueAccessor, OnInit, AfterViewInit, OnDestroy
{
  @Input() label = '';
  @Input() placeholder = 'Please enter';
  @Input() hint = '';
  @Input() multiple = false;
  @Input() disabled = false;
  @Input() width: number | string = '100%';
  @Input() chips = true;
  @Input() closableChips = true;
  @Input() clearable = false;
  @Input() openOnClear = true;
  @Input() optionLabel = 'label';
  @Input() optionInfo = 'info';
  @Input() hideDetails = false;
  @Input() persistentClear = false;
  @Input() prefixIcon: IconType = '';
  @Input() prefixIconSize: iconSizeType = '18px';
  @Input() loading = false;
  @Input() virtualScroll = false;

  @Input() set options(options: any[]) {
    if (options?.some((o) => o.inner)) {
      this._options = options;
      return;
    }

    this._options = this._toInnerOptions(options);
  }

  get options(): TreeNode[] {
    return this._options;
  }

  @Input('value') _value: any = undefined;

  set value(value: any) {
    this._value = value;
    this.onChange(value);
  }

  get value(): any {
    return this._value;
  }

  @Output() valueChanged = new EventEmitter<any>();

  @ViewChild('treeAutocompleteContainer')
  treeAutocompleteContainer!: ElementRef;

  @ViewChild('treeList') treeList!: Tree;

  private _statusChangesSubscription: Subscription = new Subscription();

  _options: TreeNode[] = [];
  optionsMap = new Map<string, TreeNode>();
  originalOptionsMap = new Map<string, any>();

  treeSelection: any;

  virtualListHeight = 240;
  virtualScrollItemSize = 40;

  error = '';
  cvtWidth = '';
  isOpened = false;
  treeContainerElement!: HTMLElement;
  optionFocused = false;

  inputText = '';
  filteredOptions = [] as any[];
  backspaceClickedOnce = false;
  activeSingle = false;
  optionHighlightedIndex = -1;

  constructor(
    @Self() @Optional() private _control: NgControl,
    private cdRef: ChangeDetectorRef
  ) {
    if (this._control) {
      this._control.valueAccessor = this;
    }
  }

  ngOnInit() {
    this.filteredOptions = this.options;
    this.cvtWidth = convertSize(this.width);
    if (!this._value) {
      if (this.multiple) {
        this._value = [];
        this.treeSelection = [];
      }
    } else {
      this.treeSelection = this._valueToTreeSelection(this.value);
    }

    this._statusChangesSubscription = this._control?.statusChanges?.subscribe(
      () => {
        this._checkErrors();
      }
    ) as Subscription;
  }

  ngAfterViewInit() {
    this._initContainerClickListener();
    this.recalcVirtualListHeight();
    this.cdRef.detectChanges();
  }

  ngOnDestroy() {
    this._statusChangesSubscription?.unsubscribe();
    if (this.treeContainerElement)
      this.treeContainerElement.removeEventListener(
        'click',
        this._handleOnContainerClick.bind(this)
      );
  }

  private _initContainerClickListener() {
    this.treeContainerElement =
      this.treeList?.el?.nativeElement?.querySelector('.p-tree-container');
    if (this.treeContainerElement) {
      this.treeContainerElement.addEventListener(
        'click',
        this._handleOnContainerClick.bind(this)
      );
    }
  }

  private _handleOnContainerClick(event: any) {
    function getParentWithClass(
      element: HTMLElement | null,
      className: string
    ) {
      let currentElement = element;
      while (currentElement) {
        if (currentElement.classList.contains(className)) {
          return currentElement;
        }
        currentElement = currentElement.parentElement;
      }
      return null;
    }

    this.optionFocused = true;

    const parent = event.target.classList.contains('p-treenode-content')
      ? event.target
      : getParentWithClass(event.target, 'p-treenode-content');

    if (
      parent?.parentElement?.classList?.contains(
        'cps-tree-node-fully-expandable'
      )
    ) {
      this.onClickFullyExpandable(event, parent.parentElement);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onChange = (event: any) => {};

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onTouched = () => {};

  registerOnChange(fn: any) {
    this.onChange = fn;
  }

  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }

  writeValue(value: any) {
    this.value = value;
  }

  private updateValue(value: any): void {
    this.writeValue(value);
    this.onChange(value);
    this.valueChanged.emit(value);
  }

  onSelectNode() {
    if (!this.multiple) {
      this._toggleOptions(this.treeAutocompleteContainer?.nativeElement, false);
    }
    // TODO some additional logic needed
  }

  onClickOutside(dd: HTMLElement) {
    this._closeAndClear(dd);
  }

  onBoxClick() {
    if (!this.multiple) {
      this.activeSingle = true;
      this.inputText = this._getValueLabel();
      this.filteredOptions = this.options;
    }
    this.focus();
    this._dehighlightOption();
  }

  onContainerKeyDown(event: any, dd: HTMLElement) {
    const code = event.keyCode;
    // escape
    if (code === 27) {
      this._closeAndClear(dd);
    }
    // enter
    else if (code === 13) {
      const option = this.filteredOptions[this.optionHighlightedIndex];
      this._clickOption(option, dd);
    }
    // click down arrow
    else if (code === 40) {
      this._initArrowsNavigaton();
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
      if (this.optionHighlightedIndex < 0) {
        this._confirmInput(event?.target?.value || '');
        event.stopPropagation();
      }
    } else if ([38, 40].includes(code)) {
      event.preventDefault();
    } else {
      this._dehighlightOption();
    }
  }

  onClickFullyExpandable(event: any, elem: HTMLElement) {
    const key = this._getHTMLElementKey(elem);
    if (!key) return;

    const treeNode = this.options.find((o) => o.key === key);
    if (!treeNode) return;

    treeNode.expanded = !treeNode.expanded;
    this._updateOptions();
    setTimeout(() => {
      this.recalcVirtualListHeight();
    });
  }

  private _getHTMLElementKey(elem: any): string {
    if (!elem?.classList) return '';
    const classList = [...elem.classList];
    const key = classList.find((className: string) => {
      return className.startsWith('key-');
    });
    if (!key) return '';
    return key.replace('key-', '');
  }

  treeSelectionChanged(selection: any) {
    this.updateValue(this._treeSelectionToValue(selection));
  }

  recalcVirtualListHeight() {
    if (!this.virtualScroll) return;
    const currentLen = this.treeList?.serializedValue?.length || 0;
    this.virtualListHeight = Math.min(
      this.virtualScrollItemSize * currentLen,
      240
    );
  }

  private _toggleOptions(dd: HTMLElement, show?: boolean): void {
    if (this.disabled || !dd) return;
    if (typeof show === 'boolean') {
      if (show) dd.classList.add('active');
      else dd.classList.remove('active');
    } else dd.classList.toggle('active');

    this.isOpened = dd.classList.contains('active');
    this.optionFocused = false;

    if (this.isOpened && this.treeSelection) {
      this._expandToNodes(
        this.multiple ? this.treeSelection : [this.treeSelection]
      );
      this._updateOptions();

      setTimeout(() => {
        this.recalcVirtualListHeight();

        const selected =
          this.treeAutocompleteContainer.nativeElement.querySelector(
            '.p-highlight'
          );
        if (selected) {
          selected.scrollIntoView({
            behavior: 'instant',
            block: 'nearest',
            inline: 'center'
          });
        } else if (this.virtualScroll && this.treeSelection) {
          let key = '';
          if (this.multiple) {
            if (this.treeSelection.length > 0) key = this.treeSelection[0].key;
          } else key = this.treeSelection.key;
          if (key) {
            const idx =
              this.treeList?.serializedValue?.findIndex(
                (v) => v.node.key === key
              ) || -1;
            if (idx >= 0) this.treeList.scrollToVirtualIndex(idx);
          }
        }
      });
    }
  }

  remove(option: TreeNode): void {
    if (!this.multiple) return;

    this.treeSelection = this.treeSelection.filter(
      (v: TreeNode) => !isEqual(v, option)
    );
    this.updateValue(this._treeSelectionToValue(this.treeSelection));
  }

  select(option: any): void {
    function includes(array: any[], val: any): boolean {
      return array ? !!find(array, (item) => isEqual(item, val)) : false;
    }

    this.backspaceClickedOnce = false;
    if (this.multiple) {
      let res = [] as any;
      if (includes(this.value, option)) {
        res = this.value.filter((v: any) => !isEqual(v, option));
      } else {
        this.options.forEach((o) => {
          if (
            this.value.some((v: any) => isEqual(v, o)) ||
            isEqual(option, o)
          ) {
            res.push(o);
          }
        });
      }
      this.updateValue(res);
    } else {
      this.updateValue(option);
    }
    this._clearInput();
    setTimeout(() => {
      this.focusInput();
    }, 0);
  }

  private _initArrowsNavigaton() {
    if (!this.isOpened) return;

    if (!this.optionFocused) {
      const firstElem = this.treeContainerElement?.querySelector(
        '.p-treenode-content'
      );
      if (firstElem) (firstElem as HTMLElement).focus();
      this.optionFocused = true;
    }
  }

  clear(dd: HTMLElement, event: any): void {
    event.stopPropagation();

    if (
      (!this.multiple && this.value) ||
      (this.multiple && this.value?.length > 0)
    ) {
      if (this.openOnClear) {
        this._toggleOptions(dd, true);
      }
      const val = this.multiple ? [] : undefined;
      this.updateValue(val);
    }
    this._clearInput();
    this._dehighlightOption();
    setTimeout(() => {
      this.focusInput();
    }, 0);
    this.optionFocused = false;
  }

  private _checkErrors(): void {
    const errors = this._control?.errors;

    if (!this._control?.control?.touched || !errors) {
      this.error = '';
      return;
    }

    if ('required' in errors) {
      this.error = 'Field is required';
      return;
    }

    const errArr = Object.values(errors);
    if (errArr.length < 1) {
      this.error = '';
      return;
    }
    const message = errArr.find((msg) => typeof msg === 'string');
    console.log('message', message);
    this.error = message || 'Unknown error';
  }

  // onOptionClick(option: any, dd: HTMLElement) {
  //   this._clickOption(option, dd);
  // }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setDisabledState(disabled: boolean) {}

  onBlur() {
    this._control?.control?.markAsTouched();
    this._checkErrors();
  }

  focusInput() {
    this.treeAutocompleteContainer?.nativeElement
      ?.querySelector('input')
      ?.focus();
  }

  focus() {
    this.treeAutocompleteContainer?.nativeElement?.focus();
    this.focusInput();
    this._toggleOptions(this.treeAutocompleteContainer?.nativeElement, true);
  }

  private _expandToNodes(nodes: any[]) {
    function getParentKey(key: string): string {
      const lastSeparatorIndex = key.lastIndexOf('-');
      if (lastSeparatorIndex !== -1) {
        return key.substring(0, lastSeparatorIndex);
      }
      return '';
    }

    nodes.forEach((node) => {
      const parentNodeKey = getParentKey(node.key);
      const parentNode = this.optionsMap.get(parentNodeKey) || null;

      if (parentNode) {
        parentNode.expanded = true;
        this._expandToNodes([parentNode]);
      }
    });
  }

  private _toInnerOptions(_options: any[]): TreeNode[] {
    function mapOption(
      o: any,
      optionLabel: string,
      optionInfo: string,
      key: string,
      originalOptionsMap: any
    ) {
      const inner = {
        inner: true,
        label: o[optionLabel],
        info: o[optionInfo],
        key,
        styleClass: 'key-' + key
      } as TreeNode;
      if (o.isDirectory) {
        inner.type = 'directory';
        inner.selectable = false;
        inner.styleClass += ' cps-tree-node-fully-expandable';
      }
      if (o.children) {
        inner.children = o.children.map((c: any, index: number) => {
          return mapOption(
            c,
            optionLabel,
            optionInfo,
            key + '-' + index,
            originalOptionsMap
          );
        });
      }
      originalOptionsMap.set(key, o);
      return inner;
    }

    const res = _options.map((option, index) => {
      return mapOption(
        option,
        this.optionLabel,
        this.optionInfo,
        '' + index,
        this.originalOptionsMap
      );
    });

    this.optionsMap = this._buildOptionsMap(res);

    return res;
  }

  private _buildOptionsMap(options: any[]): Map<string, any> {
    const nodeMap = new Map<string, any>();
    for (const option of options) {
      nodeMap.set(option.key, option);
      if (option.children) {
        const childNodeMap = this._buildOptionsMap(option.children);
        childNodeMap.forEach((value, key) => nodeMap.set(key, value));
      }
    }
    return nodeMap;
  }

  private _treeSelectionToValue(selection: any) {
    if (!selection) return this.multiple ? [] : undefined;
    if (this.multiple) {
      return selection.map((s: any) => this.originalOptionsMap.get(s.key));
    } else {
      return this.originalOptionsMap.get(selection.key);
    }
  }

  private _valueToTreeSelection(value: any) {
    function getKey(v: any, map: Map<string, any>): string {
      for (const [key, val] of map.entries()) {
        if (isEqual(v, val)) {
          return key;
        }
      }
      return '';
    }

    if (!value) return this.multiple ? [] : undefined;

    if (this.multiple) {
      const res = [] as TreeNode[];
      value.forEach((v: any) => {
        const key = getKey(v, this.originalOptionsMap);
        if (key) res.push(this.optionsMap.get(key) as TreeNode);
      });
      return res;
    } else {
      const key = getKey(value, this.originalOptionsMap);
      return key ? this.optionsMap.get(key) : undefined;
    }
  }

  // this is a fix of primeng change detection bug when virtual scroller is enabled
  private _updateOptions() {
    if (!this.virtualScroll) return;
    this.options = [...this.options];
  }

  private _clickOption(option: any, dd: HTMLElement) {
    this.select(option);
    if (!this.multiple) {
      this._toggleOptions(dd, false);
    }
  }

  filterOptions(event: any) {
    if (!this.isOpened) {
      this._toggleOptions(this.treeAutocompleteContainer?.nativeElement, true);
    }
    this.backspaceClickedOnce = false;
    const searchVal = (event?.target?.value || '').toLowerCase();

    this.filteredOptions = this.options.filter((o: any) =>
      o[this.optionLabel].toLowerCase().includes(searchVal)
    );
  }

  private _getValueLabel() {
    return this.value ? this.value[this.optionLabel] : '';
  }

  private _clearInput() {
    this.filteredOptions = this.options;
    this.inputText = '';
    this.activeSingle = false;
  }

  private _closeAndClear(dd: HTMLElement) {
    this._clearInput();
    this._toggleOptions(dd, false);
    this._dehighlightOption();
  }

  private _getHTMLOptions() {
    return (
      this.treeAutocompleteContainer?.nativeElement?.querySelectorAll(
        '.cps-autocomplete-options-option'
      ) || []
    );
  }

  private _dehighlightOption(el?: HTMLElement) {
    if (el) el.classList.remove('highlighten');
    else {
      if (this.optionHighlightedIndex < 0) return;
      const optionItems = this._getHTMLOptions();
      optionItems[this.optionHighlightedIndex].classList.remove('highlighten');
      this.optionHighlightedIndex = -1;
    }
  }

  private _confirmInput(searchVal: string) {
    if (!this.isOpened) return;
    searchVal = searchVal.toLowerCase();
    if (!searchVal) {
      if (this.multiple) return;
      this.updateValue(undefined);
      this._closeAndClear(this.treeAutocompleteContainer?.nativeElement);
      return;
    }

    const found = this.filteredOptions.find(
      (o: any) => o[this.optionLabel].toLowerCase() === searchVal
    );
    if (found) {
      this.select(found);
      this._toggleOptions(
        this.treeAutocompleteContainer?.nativeElement,
        this.multiple
      );
    } else {
      if (!this.multiple) {
        this.inputText = this._getValueLabel();
        this.filteredOptions = this.options;
        return;
      }
    }

    this._clearInput();
  }

  private _removeLastValue() {
    if (!this.multiple || this.inputText) return;

    if (this.value?.length) {
      if (this.backspaceClickedOnce) {
        this.updateValue(
          this.value.filter(
            (v: any, index: number) => index !== this.value.length - 1
          )
        );

        this.backspaceClickedOnce = false;
      } else this.backspaceClickedOnce = true;
    } else this.backspaceClickedOnce = false;

    setTimeout(() => {
      this.focusInput();
    }, 0);
  }
}
