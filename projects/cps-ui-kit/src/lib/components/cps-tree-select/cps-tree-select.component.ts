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
import { BaseTreeDropdownComponent } from '../../base_components/base-tree-dropdown.component';
import { CpsMenuComponent } from '../cps-menu/cps-menu.component';

export type CpsTreeSelectAppearanceType =
  | 'outlined'
  | 'underlined'
  | 'borderless';

/**
 * CpsTreeSelectComponent is a form component to choose from hierarchical data.
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
    CombineLabelsPipe,
    CpsMenuComponent
  ],
  providers: [CombineLabelsPipe],
  selector: 'cps-tree-select',
  templateUrl: './cps-tree-select.component.html',
  styleUrls: ['./cps-tree-select.component.scss']
})
export class CpsTreeSelectComponent
  extends BaseTreeDropdownComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  /**
   * Styling appearance of select input, it can be "outlined" or "underlined" or "borderless".
   * @group Props
   */
  @Input() appearance: CpsTreeSelectAppearanceType = 'outlined';

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
