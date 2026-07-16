import { ChangeDetectorRef, Component, Input, Optional } from '@angular/core';
import { FormsModule, NgControl } from '@angular/forms';
import { CpsIconComponent } from '../cps-icon/cps-icon.component';
import { CpsChipComponent } from '../cps-chip/cps-chip.component';
import { CpsProgressLinearComponent } from '../cps-progress-linear/cps-progress-linear.component';
import { CpsInfoCircleComponent } from '../cps-info-circle/cps-info-circle.component';
import { CombineLabelsPipe } from '../../pipes/internal/combine-labels/combine-labels.pipe';
import { TreeModule } from '../../primeng-temp/tree/public_api';
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
export class CpsTreeSelectComponent extends CpsBaseTreeDropdownComponent {
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

  onBeforeOptionsHidden() {
    this.toggleOptions(false);
  }

  onBoxClick(event?: Event) {
    event?.stopPropagation();
    this.toggleOptions();
  }

  onKeyDown(event: KeyboardEvent) {
    const code = event.code;
    if (code === 'Tab') {
      if (this.isOpened) this.toggleOptions(false);
      return;
    }

    event.preventDefault();

    if (code === 'Escape') {
      this.toggleOptions(false);
      this.componentContainer?.nativeElement?.focus();
    } else if (code === 'Enter' || code === 'NumpadEnter' || code === 'Space') {
      this.toggleOptions(!this.isOpened);
    } else if (code === 'ArrowUp' || code === 'ArrowDown') {
      const up = code === 'ArrowUp';
      if (!this.isOpened) {
        this.toggleOptions(true);
        setTimeout(() => this.initArrowsNavigaton(up));
      } else {
        this.navigateIntoOptions(up);
      }
    }
  }
}
