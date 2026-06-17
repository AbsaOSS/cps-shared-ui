import { ChangeDetectorRef, Component, Input, Optional } from '@angular/core';
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
    // Tab — close dropdown if open, let browser move focus naturally
    if (code === 'Tab') {
      if (this.isOpened) this.toggleOptions(false);
      return;
    }

    event.preventDefault();

    // Escape — close and return focus to trigger
    if (code === 'Escape') {
      this.toggleOptions(false);
      this.componentContainer?.nativeElement?.focus();
    }
    // Enter or Space — toggle dropdown
    else if (code === 'Enter' || code === 'NumpadEnter' || code === 'Space') {
      this.toggleOptions(!this.isOpened);
    }
    // Arrow Up or Down — open if closed and focus the selected node;
    // if already open, move one step away from the selected node
    else if (code === 'ArrowUp' || code === 'ArrowDown') {
      const up = code === 'ArrowUp';
      if (!this.isOpened) {
        this.toggleOptions(true);
        setTimeout(() => this.initArrowsNavigaton(up));
      } else {
        this.navigateIntoOptions(up);
      }
    }
  }

  onOptionsKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case 'Escape':
        event.preventDefault();
        this.toggleOptions(false);
        this.componentContainer?.nativeElement?.focus();
        break;

      case 'Tab':
        event.preventDefault();
        this.toggleOptions(false);
        this.componentContainer?.nativeElement?.focus();
        break;

      case 'ArrowUp':
      case 'ArrowDown': {
        this.isArrowNavigating = true;

        // PrimeNG's handler already ran (bubble phase) and moved focus synchronously.
        // If focus is still on the original element, PrimeNG hit a boundary — wrap around.
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
        // Mouse click on a fully-expandable directory row both selects and
        // toggles expand (PrimeNG's onNodeClick + our container click listener).
        // PrimeNG's own Enter/Space handling only replicates the selection half,
        // so trigger the expand toggle here to match.
        const target = event.target as HTMLElement;
        if (target?.classList?.contains('cps-tree-node-fully-expandable')) {
          const contentElem = target.querySelector<HTMLElement>(
            '.p-tree-node-content'
          );
          if (contentElem) this.onClickFullyExpandable(contentElem);
        }
        break;
      }
    }
  }
}
