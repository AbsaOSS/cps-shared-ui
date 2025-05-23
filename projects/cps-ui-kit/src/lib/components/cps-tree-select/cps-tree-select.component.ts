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
import { CombineLabelsPipe } from '../../pipes/internal/combine-labels.pipe';
import { TreeModule } from 'primeng/tree';
import { CpsMenuComponent } from '../cps-menu/cps-menu.component';
import { CpsBaseTreeDropdownComponent } from '../internal/cps-base-tree-dropdown/cps-base-tree-dropdown.component';

/**
 * CpsTreeSelectAppearanceType is used to define the border of the tree select input field.
 * @group Types
 */
export type CpsTreeSelectAppearanceType =
  | 'outlined'
  | 'underlined'
  | 'borderless';

/**
 * CpsTreeSelectComponent allows to select items from hierarchical data dropdown.
 * @group Components
 */
@Component({
  imports: [
    CommonModule,
    FormsModule,
    TreeModule,
    CpsIconComponent,
    CpsChipComponent,
    CpsProgressLinearComponent,
    CpsInfoCircleComponent,
    CombineLabelsPipe,
    CpsMenuComponent
  ],
  providers: [CombineLabelsPipe],
  selector: 'cps-tree-select',
  templateUrl: './cps-tree-select.component.html',
  styleUrls: ['./cps-tree-select.component.scss']
})
export class CpsTreeSelectComponent
  extends CpsBaseTreeDropdownComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  /**
   * Styling appearance of tree select, it can be "outlined", "underlined" or "borderless".
   * @group Props
   */
  @Input() appearance: CpsTreeSelectAppearanceType = 'outlined';

  /**
   * Placeholder text.
   * @group Props
   */
  @Input() placeholder = 'Please select';

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
    super.ngAfterViewInit();
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
  }

  onBeforeOptionsHidden() {
    this.toggleOptions(false);
  }

  onBoxClick() {
    this.toggleOptions();
  }

  onKeyDown(event: any) {
    event.preventDefault();
    const code = event.keyCode;
    // escape
    if (code === 27) {
      this.toggleOptions(false);
    }
    // click down arrow
    else if (code === 40) {
      this.initArrowsNavigaton();
    }
  }
}
