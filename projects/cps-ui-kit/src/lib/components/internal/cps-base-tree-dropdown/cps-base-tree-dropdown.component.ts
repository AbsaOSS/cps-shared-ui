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
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { TreeNode } from 'primeng/api';
import { Subscription } from 'rxjs';
import { Tree } from 'primeng/tree';
import { isEqual } from 'lodash-es';
import { IconType, iconSizeType } from '../../cps-icon/cps-icon.component';
import { convertSize } from '../../../utils/internal/size-utils';
import { TooltipPosition } from '../../../directives/cps-tooltip.directive';
import { CpsMenuComponent } from '../../cps-menu/cps-menu.component';

@Component({
  template: ''
})
export class CpsBaseTreeDropdownComponent
  implements ControlValueAccessor, OnInit, AfterViewInit, OnDestroy
{
  @Input() label = '';
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
  @Input() numToleratedItems = 10;
  @Input() infoTooltip = '';
  @Input() infoTooltipClass = 'cps-tooltip-content';
  @Input() infoTooltipMaxWidth: number | string = '100%';
  @Input() infoTooltipPersistent = false;
  @Input() infoTooltipPosition: TooltipPosition = 'top';
  @Input() initialExpandDirectories = false;
  @Input() initialExpandAll = false;

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

  @ViewChild('componentContainer')
  componentContainer!: ElementRef;

  @ViewChild('optionsMenu')
  optionsMenu!: CpsMenuComponent;

  @ViewChild('treeList') treeList!: Tree;

  @ViewChild('boxEl')
  boxEl!: ElementRef;

  private _statusChangesSubscription: Subscription = new Subscription();

  _options: TreeNode[] = [];
  optionsMap = new Map<string, TreeNode>();
  originalOptionsMap = new Map<string, any>();

  virtualListHeight = 240;
  virtualScrollItemSize = 40;

  error = '';
  cvtWidth = '';
  isOpened = false;
  optionFocused = false;
  isAutocomplete = false;

  treeContainerElement!: HTMLElement;
  treeSelection: any;

  boxWidth = 0;
  resizeObserver: ResizeObserver;

  constructor(
    @Self() @Optional() public control: NgControl,
    public cdRef: ChangeDetectorRef
  ) {
    if (this.control) {
      this.control.valueAccessor = this;
    }
    this.resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        if (entry?.target) this.boxWidth = (entry.target as any).offsetWidth;
      });
    });
  }

  ngOnInit() {
    this.cvtWidth = convertSize(this.width);
    if (!this._value) {
      if (this.multiple) {
        this._value = [];
        this.treeSelection = [];
      }
    } else {
      this.treeSelection = this._valueToTreeSelection(this.value);
    }

    this._statusChangesSubscription = this.control?.statusChanges?.subscribe(
      () => {
        this._checkErrors();
      }
    ) as Subscription;
  }

  ngAfterViewInit() {
    this._initContainerClickListener();
    this.recalcVirtualListHeight();
    this.resizeObserver.observe(this.boxEl.nativeElement);
    this.cdRef.detectChanges();
  }

  ngOnDestroy() {
    this._statusChangesSubscription?.unsubscribe();

    this.treeContainerElement?.removeEventListener(
      'click',
      this._handleOnContainerClick.bind(this)
    );

    this.resizeObserver?.disconnect();
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

    const elem = event.target.classList.contains('p-treenode-content')
      ? event.target
      : getParentWithClass(event.target, 'p-treenode-content');

    if (
      elem?.parentElement?.classList?.contains('cps-tree-node-fully-expandable')
    ) {
      this.onClickFullyExpandable(elem);
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

  writeValue(value: any, internal = false) {
    this.value = value;
    if (!internal && value !== null) {
      this.treeSelection = this._valueToTreeSelection(this.value);
    }
  }

  updateValue(value: any): void {
    this.writeValue(value, true);
    this.onChange(value);
    this.valueChanged.emit(value);
  }

  onSelectNode() {
    if (!this.multiple) {
      this.toggleOptions(false);
    }
  }

  onClickFullyExpandable(elem: HTMLElement) {
    const parent = elem.parentElement;
    const key = this._getHTMLElementKey(parent);
    if (!key) return;

    const treeNode = this.options.find((o) => o.key === key);
    if (!treeNode) return;

    treeNode.expanded = !treeNode.expanded;
    this.updateOptions();
    setTimeout(() => {
      this._nodeToggled(elem);
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
    this.updateValue(this.treeSelectionToValue(selection));
  }

  recalcVirtualListHeight() {
    if (!this.virtualScroll) return;
    const currentLen = this.treeList?.serializedValue?.length || 0;
    this.virtualListHeight = Math.min(
      this.virtualScrollItemSize * currentLen,
      240
    );
  }

  toggleOptions(show?: boolean): void {
    if (this.disabled || this.isOpened === show) return;

    if (typeof show === 'boolean') {
      if (show) {
        this.optionsMenu.show({
          target: this.boxEl.nativeElement
        });
      } else {
        this.optionsMenu.hide();
      }
    } else {
      this.optionsMenu.toggle({
        target: this.boxEl.nativeElement
      });
    }

    this.isOpened = this.optionsMenu.isVisible();

    this.optionFocused = false;
    if (this.isOpened && this.treeSelection) {
      this._expandToNodes(
        this.multiple ? this.treeSelection : [this.treeSelection]
      );
      this.updateOptions();
      setTimeout(() => {
        this.recalcVirtualListHeight();
        const selected = this.treeContainerElement.querySelector(
          '.p-highlight'
        ) as any;
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
    this.updateValue(this.treeSelectionToValue(this.treeSelection));
  }

  initArrowsNavigaton() {
    if (!this.isOpened) return;

    if (!this.optionFocused) {
      const firstElem = this.treeContainerElement?.querySelector(
        '.p-treenode-content'
      );
      if (firstElem) (firstElem as HTMLElement).focus();
      this.optionFocused = true;
    }
  }

  private _nodeToggled(elem: HTMLElement) {
    this.recalcVirtualListHeight();
    setTimeout(() => {
      this.optionsMenu.align();
    });
    elem?.focus();
  }

  private _nodeToggledWithChevron(elem: HTMLElement) {
    this._nodeToggled(elem);
    // fix primeng tree event stop propagation
    this.optionsMenu.selfClick = false;
  }

  onNodeExpand(event: any) {
    this._nodeToggledWithChevron(
      event?.originalEvent?.currentTarget?.parentElement
    );
  }

  onNodeCollapse(event: any) {
    this._nodeToggledWithChevron(
      event?.originalEvent?.currentTarget?.parentElement
    );
  }

  clear(event: any): void {
    event.stopPropagation();

    if (
      (!this.multiple && this.treeSelection) ||
      (this.multiple && this.treeSelection?.length > 0)
    ) {
      if (this.openOnClear) {
        this.toggleOptions(true);
      }
      const val = this.multiple ? [] : undefined;
      this.treeSelection = val;
      this.updateValue(val);
    }
    this.optionFocused = false;
  }

  private _checkErrors(): void {
    const errors = this.control?.errors;

    if (!this.control?.control?.touched || !errors) {
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

    this.error = message || 'Unknown error';
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setDisabledState(disabled: boolean) {}

  onBlur() {
    this.control?.control?.markAsTouched();
    this._checkErrors();
  }

  focus() {
    this.componentContainer?.nativeElement?.focus();
    this.toggleOptions(true);
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
    const mapOption = (
      o: any,
      optionLabel: string,
      optionInfo: string,
      key: string,
      originalOptionsMap: any
    ) => {
      const inner = {
        inner: true,
        label: o[optionLabel],
        info: o[optionInfo],
        key,
        styleClass: 'key-' + key
      } as TreeNode;

      if (this.initialExpandAll) {
        inner.expanded = true;
      }

      if (o.isDirectory) {
        inner.type = 'directory';
        inner.selectable = false;
        inner.styleClass += ' cps-tree-node-fully-expandable';
        if (this.initialExpandDirectories) {
          inner.expanded = true;
        }
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
    };

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

  treeSelectionToValue(selection: any) {
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
  updateOptions() {
    if (!this.virtualScroll) return;
    this.options = [...this.options];
  }
}
