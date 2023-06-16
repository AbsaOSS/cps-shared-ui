import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
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
import { CpsIconComponent, iconSizeType } from '../cps-icon/cps-icon.component';
import { CpsChipComponent } from '../cps-chip/cps-chip.component';
import { CpsProgressLinearComponent } from '../cps-progress-linear/cps-progress-linear.component';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { LabelByValuePipe } from '../../pipes/label-by-value.pipe';
import { CombineLabelsPipe } from '../../pipes/combine-labels.pipe';
import { find, isEqual } from 'lodash-es';
import { Tree, TreeModule } from 'primeng/tree';
// import { TreeNode } from 'primeng/api';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TreeModule,
    ClickOutsideDirective,
    CpsIconComponent,
    CpsChipComponent,
    CpsProgressLinearComponent,
    LabelByValuePipe,
    CombineLabelsPipe
  ],
  providers: [LabelByValuePipe, CombineLabelsPipe],
  selector: 'cps-tree-select',
  templateUrl: './cps-tree-select.component.html',
  styleUrls: ['./cps-tree-select.component.scss']
})
export class CpsTreeSelectComponent
  implements ControlValueAccessor, OnInit, AfterViewInit, OnDestroy
{
  @Input() label = '';
  @Input() placeholder = 'Please select';
  @Input() hint = '';
  @Input() multiple = false;
  @Input() disabled = false;
  @Input() width: number | string = '100%';
  @Input() chips = true;
  @Input() closableChips = true;
  @Input() clearable = false;
  @Input() openOnClear = true;
  @Input() options = [] as any[];
  @Input() optionLabel = 'label';
  @Input() optionInfo = 'info';
  @Input() hideDetails = false;
  @Input() persistentClear = false;
  @Input() prefixIcon = '';
  @Input() prefixIconSize: iconSizeType = '18px';
  @Input() loading = false;
  @Input() virtualScroll = false; // TODO

  @Input('value') _value: any = undefined;

  set value(value: any) {
    this._value = value;
    this.onChange(value);
  }

  get value(): any {
    return this._value;
  }

  @Output() valueChanged = new EventEmitter<any>();

  @ViewChild('selectContainer')
  selectContainer!: ElementRef;

  @ViewChild('treeList') treeList!: Tree;

  private _statusChangesSubscription: Subscription = new Subscription();

  error = '';
  cvtWidth = '';
  isOpened = false;
  treeContainerElement!: HTMLElement;
  optionFocused = false;

  constructor(@Self() @Optional() private _control: NgControl) {
    if (this._control) {
      this._control.valueAccessor = this;
    }
  }

  ngOnInit() {
    this.cvtWidth = convertSize(this.width);
    if (this.multiple && !this._value) {
      this._value = [];
    }

    this._statusChangesSubscription = this._control?.statusChanges?.subscribe(
      () => {
        this._checkErrors();
      }
    ) as Subscription;
  }

  ngAfterViewInit() {
    this._initContainerClickListener();
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

  private _getHTMLElementKey(elem: any): string {
    if (!elem?.classList) return '';
    const classList = [...elem.classList];
    const key = classList.find((className: string) => {
      return className.startsWith('key-');
    });
    if (!key) return '';
    return key.replace('key-', '');
  }

  onClickFullyExpandable(event: any, elem: HTMLElement) {
    const key = this._getHTMLElementKey(elem);
    if (!key) return;

    const treeNode = this.options.find((o) => o.key === key);
    if (!treeNode) return;

    treeNode.expanded = !treeNode.expanded;
  }

  ngOnDestroy() {
    this._statusChangesSubscription?.unsubscribe();
    if (this.treeContainerElement)
      this.treeContainerElement.removeEventListener(
        'click',
        this._handleOnContainerClick.bind(this)
      );
  }

  onSelectNode(event: any) {
    if (!event?.node) return;
    if (!this.multiple) {
      this._toggleOptions(this.selectContainer?.nativeElement, false);
    }
  }

  private _toggleOptions(dd: HTMLElement, show?: boolean): void {
    if (this.disabled || !dd) return;
    if (typeof show === 'boolean') {
      if (show) dd.classList.add('active');
      else dd.classList.remove('active');
    } else dd.classList.toggle('active');

    this.isOpened = dd.classList.contains('active');
    this.optionFocused = false;

    if (this.isOpened && this.value) {
      this._expandToNodes(this.multiple ? this.value : [this.value]);

      setTimeout(() => {
        const selected =
          this.selectContainer.nativeElement.querySelector('.p-highlight');
        if (selected)
          selected.scrollIntoView({
            behavior: 'instant',
            block: 'nearest',
            inline: 'center'
          });
      });
    }
  }

  select(option: any): void {
    function includes(array: any[], val: any): boolean {
      return array ? !!find(array, (item) => isEqual(item, val)) : false;
    }

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

  onClickOutside(dd: HTMLElement) {
    this._toggleOptions(dd, false);
  }

  onBoxClick(dd: HTMLElement) {
    this._toggleOptions(dd);
  }

  onKeyDown(event: any, dd: HTMLElement) {
    event.preventDefault();
    const code = event.keyCode;
    // escape
    if (code === 27) {
      this._toggleOptions(dd, false);
    }
    // click down arrow
    else if ([40].includes(code)) {
      this._initArrowsNavigaton();
    }
  }

  toggleAll() {
    let res = [];
    if (this.value.length < this.options.length) {
      res = this.options;
    }
    this.updateValue(res);
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

    this.error = message || 'Unknown error';
  }

  onChange = (value: any) => {
    this.valueChanged.emit(value);
  };

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
    this.optionFocused = false;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setDisabledState(disabled: boolean) {}

  onBlur() {
    this._control?.control?.markAsTouched();
    this._checkErrors();
  }

  focus() {
    this.selectContainer?.nativeElement?.focus();
    this._toggleOptions(this.selectContainer?.nativeElement, true);
  }

  // TODO
  // private _assignKeys() {}

  // TODO
  // getSelectedPath() {}

  private _expandToNodes(nodes: any[]) {
    const nodeMap = this._buildNodeMap(this.options);
    for (const node of nodes) {
      const parentNode = this._getParentNode(node.key, nodeMap);
      if (parentNode) {
        parentNode.expanded = true;
        this._expandToNodes([parentNode]);
      }
    }
  }

  private _buildNodeMap(options: any[]): Map<string, any> {
    const nodeMap = new Map<string, any>();
    for (const option of options) {
      nodeMap.set(option.key, option);
      if (option.children) {
        const childNodeMap = this._buildNodeMap(option.children);
        childNodeMap.forEach((value, key) => nodeMap.set(key, value));
      }
    }
    return nodeMap;
  }

  private _getParentNode(key: string, nodeMap: Map<string, any>): any | null {
    const parentNodeKey = this._getParentKey(key);
    return nodeMap.get(parentNodeKey) || null;
  }

  private _getParentKey(key: string): string {
    const lastSeparatorIndex = key.lastIndexOf('-');
    if (lastSeparatorIndex !== -1) {
      return key.substring(0, lastSeparatorIndex);
    }
    return '';
  }
}
