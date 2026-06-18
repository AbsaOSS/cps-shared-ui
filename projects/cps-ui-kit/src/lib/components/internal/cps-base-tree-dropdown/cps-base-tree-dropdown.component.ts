import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  computed,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  Self,
  ViewChild,
  type SimpleChanges
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ControlValueAccessor, NgControl, Validators } from '@angular/forms';
import { TreeNode } from 'primeng/api';
import {
  generateUniqueId,
  logMissingAriaLabelError
} from '../../../utils/internal/accessibility-utils';
import { Subscription } from 'rxjs';
import { Tree } from 'primeng/tree';
import { isEqual } from 'lodash-es';
import { IconType, iconSizeType } from '../../cps-icon/cps-icon.component';
import { convertSize } from '../../../utils/internal/size-utils';
import { CpsTooltipPosition } from '../../../directives/cps-tooltip/cps-tooltip.directive';
import { CpsMenuComponent } from '../../cps-menu/cps-menu.component';
import { CPS_ROOT_FONT_SIZE_SERVICE } from '../../../services/cps-root-font-size/cps-root-font-size.service';

const VIRTUAL_SCROLL_ITEM_SIZE_REM = 2.5;
const VIRTUAL_SCROLL_MAX_VISIBLE_ITEMS = 6;

/**
 * BaseTreeDropdownComponent is an internal base component to support hierarchical data dropdown.
 * @group Components
 */
@Component({
  template: '',
  standalone: false
})
export class CpsBaseTreeDropdownComponent
  implements ControlValueAccessor, OnInit, OnChanges, AfterViewInit, OnDestroy
{
  /**
   * Label of the component.
   * @group Props
   */
  @Input() label = '';

  /**
   * Aria label for accessibility, takes precedence over label.
   * @group Props
   */
  @Input() ariaLabel = '';

  /**
   * Bottom hint text.
   * @group Props
   */
  @Input() hint = '';

  /**
   * Specifies if multiple values can be selected.
   * @group Props
   */
  @Input() multiple = false;

  /**
   * Determines whether the component is disabled.
   * @group Props
   */
  @Input() disabled = false;

  /**
   * Width of the component, of type number denoting pixels or string.
   * @group Props
   */
  @Input() width: number | string = '100%';

  /**
   * When selecting an element, it will appear in a form of a chip.
   * @group Props
   */
  @Input() chips = true;

  /**
   * Determines whether the chips can be directly removed.
   * @group Props
   */
  @Input() closableChips = true;

  /**
   * When enabled, a clear icon is displayed to clear the value.
   * @group Props
   */
  @Input() clearable = false;

  /**
   * Determines whether the dropdown should open on clear.
   * @group Props
   */
  @Input() openOnClear = true;

  /**
   * Name of the label field of an option.
   * @group Props
   */
  @Input() optionLabel = 'label';

  /**
   * Name of the info field of an option, shows the additional information text.
   * @group Props
   */
  @Input() optionInfo = 'info';

  /**
   * Options for hiding details.
   * @group Props
   */
  @Input() hideDetails = false;

  /**
   * Determines whether the component should have persistent clear icon.
   * @group Props
   */
  @Input() persistentClear = false;

  /**
   * Icon before input value.
   * @group Props
   */
  @Input() prefixIcon: IconType = '';

  /**
   * Size of icon before input value, of type number, string, 'fill', 'xsmall', 'small', 'normal' or 'large'.
   * @group Props
   */
  @Input() prefixIconSize: iconSizeType = '1.125rem';

  /**
   * When enabled, a loading bar is displayed.
   * @group Props
   */
  @Input() loading = false;

  /**
   * Determines whether only the elements within scrollable area should be added into the DOM.
   * @group Props
   */
  @Input() virtualScroll = false;

  /**
   * Determines how many additional elements to add to the DOM outside of the view.
   * @group Props
   */
  @Input() numToleratedItems = 10;

  /**
   * When it is not an empty string, an info icon is displayed to show text for more info.
   * @group Props
   */
  @Input() infoTooltip = '';

  /**
   * Info tooltip class for styling.
   * @group Props
   */
  @Input() infoTooltipClass = 'cps-tooltip-content';

  /**
   * Max width of infoTooltip of type number denoting pixels or string.
   * @group Props
   */
  @Input() infoTooltipMaxWidth: number | string = '100%';

  /**
   * Determines whether the infoTooltip is persistent.
   * @group Props
   */
  @Input() infoTooltipPersistent = false;

  /**
   * Position of infoTooltip, it can be 'top', 'bottom', 'left' or 'right'.
   * @group Props
   */
  @Input() infoTooltipPosition: CpsTooltipPosition = 'top';

  /**
   * When set, it expands all directiories initially.
   * @group Props
   */
  @Input() initialExpandDirectories = false;

  /**
   * When set, it expands all options initially.
   * @group Props
   */
  @Input() initialExpandAll = false;

  /**
   * Determines whether the chevron icon should be displayed.
   * @group Props
   */
  @Input() showChevron = true;

  /**
   * An array of objects to display as the available options.
   * @group Props
   */
  @Input() options: any[] = [];

  /**
   * Value of the component.
   * @group Props
   */
  @Input('value') _value: any = undefined;

  set value(value: any) {
    this._value = value;
    this.onChange(value);
  }

  get value(): any {
    return this._value;
  }

  /**
   * Callback to invoke on value change.
   * @param {any} any - value changed.
   * @group Emits
   */
  @Output() valueChanged = new EventEmitter<any>();

  /**
   * Callback to invoke when the component receives focus.
   * @param {any}
   * @group Emits
   */
  @Output() focused = new EventEmitter();

  /**
   * Callback to invoke when the component loses focus.
   * @param {any}
   * @group Emits
   */
  @Output() blurred = new EventEmitter();

  @ViewChild('componentContainer')
  componentContainer!: ElementRef;

  @ViewChild('optionsMenu')
  optionsMenu!: CpsMenuComponent;

  @ViewChild('treeList') treeList!: Tree;

  @ViewChild('boxEl')
  boxEl!: ElementRef;

  private _statusChangesSubscription?: Subscription;

  innerOptions: TreeNode[] = [];
  optionsMap = new Map<string, TreeNode>();

  private _treeRefreshKey = 0;

  readonly treeTrackBy = (
    _index: number,
    item: TreeNode & { node?: TreeNode }
  ) => {
    if (this.virtualScroll) return item?.node?.key ?? item?.key ?? _index;
    return `${item?.key}-${this._treeRefreshKey}`;
  };

  originalOptionsMap = new Map<string, any>();

  private readonly _cpsRootFontSizeService = inject(CPS_ROOT_FONT_SIZE_SERVICE);
  protected readonly _document = inject(DOCUMENT);

  readonly virtualScrollItemSizePx = computed(
    () =>
      (this._cpsRootFontSizeService?.fontSize() || 16) *
      VIRTUAL_SCROLL_ITEM_SIZE_REM
  );

  virtualListHeightRem =
    VIRTUAL_SCROLL_ITEM_SIZE_REM * VIRTUAL_SCROLL_MAX_VISIBLE_ITEMS;

  hintId = '';
  errorId = '';
  optionsTreeId = '';

  error = '';
  cvtWidth = '';
  isOpened = false;
  optionFocused = false;
  isAutocomplete = false;
  isArrowNavigating = false;

  get isRequired(): boolean {
    return this.control?.control?.hasValidator(Validators.required) ?? false;
  }

  get describedBy(): string | null {
    if (this.hideDetails) return null;
    if (this.error) return this.errorId;
    if (this.hint) return this.hintId;
    return null;
  }

  treeContainerElement!: HTMLElement;
  treeSelection: any;

  boxWidthPx = 0;
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
        if (entry?.target) this.boxWidthPx = (entry.target as any).offsetWidth;
      });
    });
  }

  ngOnInit() {
    const prefix = this.isAutocomplete
      ? 'cps-treeautocomplete'
      : 'cps-treeselect';
    this.hintId = generateUniqueId(`${prefix}-hint`);
    this.errorId = generateUniqueId(`${prefix}-error`);
    this.optionsTreeId = generateUniqueId(`${prefix}-options`);
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
    );

    logMissingAriaLabelError(
      this.isAutocomplete
        ? 'CpsTreeAutocompleteComponent'
        : 'CpsTreeSelectComponent',
      this.label,
      this.ariaLabel
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.width) {
      this.cvtWidth = convertSize(this.width);
    }
    if (changes.options) {
      this.innerOptions = this._toInnerOptions(this.options);
    }
    if (changes.label || changes.ariaLabel) {
      logMissingAriaLabelError(
        this.isAutocomplete
          ? 'CpsTreeAutocompleteComponent'
          : 'CpsTreeSelectComponent',
        this.label,
        this.ariaLabel
      );
    }
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

  expandAll() {
    this.optionsMap?.forEach((value) => {
      if (value.children) value.expanded = true;
    });
  }

  collapseAll() {
    this.optionsMap?.forEach((value) => {
      if (value.children) value.expanded = false;
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onChange = (_event: any) => {};

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

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setDisabledState(_disabled: boolean) {}

  onBlur() {
    this._checkErrors();
    this.blurred.emit();
  }

  onFocus() {
    this.control?.control?.markAsTouched();
    this.focused.emit();
  }

  focus() {
    this.componentContainer?.nativeElement?.focus();
    this.toggleOptions(true);
  }

  updateValue(value: any): void {
    this.writeValue(value, true);
    this.onChange(value);
    this.valueChanged.emit(value);
  }

  clear(event?: any): void {
    event?.stopPropagation();

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

  onSelectNode() {
    if (!this.multiple) {
      this.toggleOptions(false);
      this.componentContainer?.nativeElement?.focus();
    }
  }

  onClickFullyExpandable(elem: HTMLElement) {
    const parent = elem.parentElement;
    const key = this._getHTMLElementKey(parent);
    if (!key) return;

    const treeNode = this.innerOptions.find((o) => o.key === key);
    if (!treeNode) return;

    treeNode.expanded = !treeNode.expanded;
    this.updateOptions();
    this._treeRefreshKey++;
    this.treeList?.cd?.markForCheck();
    setTimeout(() => {
      this._nodeToggled(elem, key);
    });
  }

  treeSelectionChanged(selection: any) {
    this.updateValue(this.treeSelectionToValue(selection));
  }

  recalcVirtualListHeight() {
    if (!this.virtualScroll) return;
    const currentLen = this.treeList?.serializedValue?.length || 0;
    this.virtualListHeightRem =
      VIRTUAL_SCROLL_ITEM_SIZE_REM *
      Math.min(currentLen, VIRTUAL_SCROLL_MAX_VISIBLE_ITEMS);
    this._setTreeListHeight(this.virtualListHeightRem + 'rem');

    this.treeList?.scroller?.calculateOptions();
    this.treeList?.scroller?.cd?.detectChanges();
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
    this.isArrowNavigating = false;
    if (this.isOpened) {
      if (this.treeSelection) {
        this._expandToNodes(
          this.multiple ? this.treeSelection : [this.treeSelection]
        );
        this._treeRefreshKey++;
        this.treeList?.cd?.markForCheck();
      }
      setTimeout(() => {
        this.updateOptions();
        this.recalcVirtualListHeight();
        const selected = this.treeContainerElement?.querySelector(
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
                // https://github.com/primefaces/primeng/blob/v16.4.3/src/app/components/tree/tree.ts#L1125
                (v: any) => v.node.key === key
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

  initArrowsNavigaton(up = false) {
    if (!this.isOpened) return;

    if (!this.optionFocused) {
      const elemToFocus =
        this.treeContainerElement?.querySelector(
          '[role="treeitem"][aria-selected="true"]'
        ) ??
        (up
          ? this._getLastVisibleTreeNodeLi()
          : this.treeContainerElement?.querySelector('.p-tree-node'));

      this._focusTreeNode(elemToFocus as HTMLElement | null);
      this.optionFocused = true;
      this.isArrowNavigating = true;
    }
  }

  protected _focusTreeNode(elem: HTMLElement | null) {
    if (!elem) return;
    this.treeContainerElement
      ?.querySelectorAll<HTMLElement>('[role="treeitem"]')
      .forEach((li) => {
        li.tabIndex = -1;
      });
    elem.tabIndex = 0;
    elem.focus();
  }

  navigateIntoOptions(up: boolean) {
    if (!this.isOpened || this.optionFocused) return;
    const hasSelected = !!this.treeContainerElement?.querySelector(
      '[role="treeitem"][aria-selected="true"]'
    );

    this.initArrowsNavigaton(up);

    if (!hasSelected) return;

    const active = this._document.activeElement as HTMLElement | null;
    if (!active || !this.treeContainerElement?.contains(active)) return;

    const items = Array.from(
      this.treeContainerElement.querySelectorAll<HTMLElement>(
        '[role="treeitem"]'
      )
    );
    const next = items[items.indexOf(active) + (up ? -1 : 1)];
    if (next) this._focusTreeNode(next);
  }

  protected _onOptionsClose(): void {
    this.toggleOptions(false);
    this.componentContainer?.nativeElement?.focus();
  }

  onOptionsKeyDown(event: KeyboardEvent): void {
    switch (event.code) {
      case 'Escape':
      case 'Tab':
        event.preventDefault();
        this._onOptionsClose();
        break;

      case 'ArrowUp':
      case 'ArrowDown': {
        this.isArrowNavigating = true;
        const target = event.target as HTMLElement;
        if (this._document.activeElement === target) {
          event.preventDefault();
          if (event.code === 'ArrowUp') {
            this._focusTreeNode(this._getLastVisibleTreeNodeLi());
          } else {
            this._focusTreeNode(
              this.treeContainerElement?.querySelector<HTMLElement>(
                '[role="treeitem"]'
              ) ?? null
            );
          }
        }
        break;
      }

      case 'Enter':
      case 'Space':
      case 'NumpadEnter': {
        const target = event.target as HTMLElement;
        const ariaExpanded = target.getAttribute('aria-expanded');
        if (ariaExpanded === null) break;

        const isCollapsed = ariaExpanded !== 'true';
        const isFullyExpandable = target.classList.contains(
          'cps-tree-node-fully-expandable'
        );

        if (isCollapsed || isFullyExpandable) {
          const toggleBtn = target.querySelector<HTMLElement>(
            '.p-tree-node-toggle-button'
          );
          if (toggleBtn) {
            toggleBtn.click();
            if (isCollapsed) {
              setTimeout(() => {
                const firstChild =
                  target.querySelector<HTMLElement>('[role="treeitem"]');
                if (firstChild) this._focusTreeNode(firstChild);
              });
            }
          }
        }
        break;
      }
    }
  }

  private _findLastVisibleDescendantLi(pTreeNode: Element): HTMLElement | null {
    const li = Array.from(pTreeNode.children).find(
      (el) => el.getAttribute('data-pc-section') === 'node'
    ) as HTMLElement | undefined;
    const childrenUl = li?.children[1];
    if (childrenUl && childrenUl.children.length > 0) {
      return this._findLastVisibleDescendantLi(
        childrenUl.children[childrenUl.children.length - 1]
      );
    }
    return li ?? null;
  }

  protected _getLastVisibleTreeNodeLi(): HTMLElement | null {
    const lastPTreeNode = this.treeContainerElement?.lastElementChild;
    return lastPTreeNode
      ? this._findLastVisibleDescendantLi(lastPTreeNode)
      : null;
  }

  onNodeExpand(event: any) {
    this._nodeToggledWithChevron(
      event?.originalEvent?.currentTarget?.parentElement
    );
    if (this.virtualScroll) this._refocusVirtualNode(event?.node?.key);
  }

  onNodeCollapse(event: any) {
    this._nodeToggledWithChevron(
      event?.originalEvent?.currentTarget?.parentElement
    );
    if (this.virtualScroll) this._refocusVirtualNode(event?.node?.key);
  }

  treeSelectionToValue(selection: any) {
    if (!selection) return this.multiple ? [] : undefined;
    if (this.multiple) {
      return selection.map((s: any) => this.originalOptionsMap.get(s.key));
    } else {
      return this.originalOptionsMap.get(selection.key);
    }
  }

  // this is a fix of primeng change detection bug when virtual scroller is enabled
  updateOptions() {
    if (!this.virtualScroll) return;
    this.treeList?.updateSerializedValue();
  }

  private _initContainerClickListener() {
    this.treeContainerElement = this.treeList?.el?.nativeElement?.querySelector(
      '.p-tree-root-children'
    );
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
    this.isArrowNavigating = false;

    const elem = event.target.classList.contains('p-tree-node-content')
      ? event.target
      : getParentWithClass(event.target, 'p-tree-node-content');

    if (
      elem?.parentElement?.classList?.contains('cps-tree-node-fully-expandable')
    ) {
      this.onClickFullyExpandable(elem);
    }
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

  private _setTreeListHeight(height: string) {
    if (this.treeList?.scroller?.style)
      this.treeList.scroller.style.height = height;
  }

  private _nodeToggled(elem: HTMLElement, key?: string) {
    this.recalcVirtualListHeight();
    setTimeout(() => {
      this.optionsMenu.align();
    });

    if (key) {
      this._focusTreeNode(
        this.treeContainerElement?.querySelector<HTMLElement>(`.key-${key}`) ??
          null
      );
    } else if (elem?.parentElement) {
      this._focusTreeNode(elem.parentElement as HTMLElement);
    }
  }

  private _refocusVirtualNode(key: string | undefined) {
    if (!key) return;
    setTimeout(() => {
      this._focusTreeNode(
        this.treeContainerElement?.querySelector<HTMLElement>(`.key-${key}`) ??
          null
      );
    });
  }

  private _nodeToggledWithChevron(elem: HTMLElement) {
    this._nodeToggled(elem);
    // fix primeng tree event stop propagation
    this.optionsMenu.selfClick = false;
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

      if (o.isDirectory) {
        inner.type = 'directory';
        inner.selectable = false;
        inner.styleClass += ' cps-tree-node-fully-expandable';
        inner.expanded = this.initialExpandDirectories;
      }
      if (o.children) {
        inner.expanded = this.initialExpandAll || !!inner.expanded;

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
      const res: TreeNode[] = [];
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
}
