import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Optional,
  ViewChild
} from '@angular/core';
import { FormsModule, NgControl } from '@angular/forms';
import { CpsIconComponent } from '../cps-icon/cps-icon.component';
import { CpsChipComponent } from '../cps-chip/cps-chip.component';
import { CpsProgressLinearComponent } from '../cps-progress-linear/cps-progress-linear.component';
import { CpsInfoCircleComponent } from '../cps-info-circle/cps-info-circle.component';
import { ClickOutsideDirective } from '../../directives/internal/click-outside.directive';
import { CombineLabelsPipe } from '../../pipes/internal/combine-labels.pipe';
import { Tree, TreeModule } from 'primeng/tree';
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
    CpsProgressLinearComponent,
    CpsInfoCircleComponent,
    CombineLabelsPipe
  ],
  providers: [CombineLabelsPipe],
  selector: 'cps-tree-select',
  templateUrl: './cps-tree-select.component.html',
  styleUrls: ['./cps-tree-select.component.scss']
})
export class CpsTreeSelectComponent
  extends CpsTreeDropdownBaseComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('treeSelectContainer')
  treeSelectContainer!: ElementRef;

  @ViewChild('treeSelectList') treeSelectList!: Tree;

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
    this.treeContainer = this.treeSelectContainer;
    this.treeList = this.treeSelectList;
    super.ngAfterViewInit();
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
  }

  onClickOutside(dd: HTMLElement) {
    this.toggleOptions(dd, false);
  }

  onBoxClick(dd: HTMLElement) {
    this.toggleOptions(dd);
  }

  onKeyDown(event: any, dd: HTMLElement) {
    event.preventDefault();
    const code = event.keyCode;
    // escape
    if (code === 27) {
      this.toggleOptions(dd, false);
    }
    // click down arrow
    else if (code === 40) {
      this.initArrowsNavigaton();
    }
  }
}
