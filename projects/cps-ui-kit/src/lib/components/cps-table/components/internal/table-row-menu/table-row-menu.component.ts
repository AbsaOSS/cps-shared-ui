import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CpsIconComponent } from '../../../../cps-icon/cps-icon.component';
import {
  CpsMenuComponent,
  CpsMenuItem
} from '../../../../cps-menu/cps-menu.component';

/**
 * TableRowMenuComponent is an internal component which applies the menu to each row.
 * @group Components
 */
@Component({
  selector: 'table-row-menu',
  standalone: true,
  imports: [CpsIconComponent, CpsMenuComponent],
  templateUrl: './table-row-menu.component.html',
  styleUrls: ['./table-row-menu.component.scss']
})
export class TableRowMenuComponent implements OnInit {
  /**
   * Callback to invoke when edit-row button is clicked.
   * @param {any} any - button clicked.
   * @group Emits
   */
  @Output() editRowBtnClicked = new EventEmitter<any>();

  /**
   * Callback to invoke when remove-row button is clicked.
   * @param {any} any - button clicked.
   * @group Emits
   */
  @Output() removeRowBtnClicked = new EventEmitter<any>();

  private _showRowRemoveButton = true;

  /**
   * Determines whether the 'Remove' button should be displayed in the menu.
   * If true, 'Remove' button is shown. If false, it's hidden.
   * @group Props
   */
  @Input()
  set showRowRemoveButton(value: boolean) {
    this._showRowRemoveButton = value;
    this.initializeItems();
  }

  get showRowRemoveButton(): boolean {
    return this._showRowRemoveButton;
  }

  items: CpsMenuItem[] = [];

  ngOnInit(): void {
    this.initializeItems();
  }

  initializeItems() {
    this.items = [
      {
        title: 'Edit',
        icon: 'edit',
        action: (event: any) => {
          this.editRowBtnClicked.emit(event);
        }
      }
    ];

    if (this.showRowRemoveButton) {
      this.items.push({
        title: 'Remove',
        icon: 'remove',
        action: (event: any) => {
          this.removeRowBtnClicked.emit(event);
        }
      });
    }
  }
}
