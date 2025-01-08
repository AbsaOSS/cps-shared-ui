import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CpsIconComponent } from '../../../../cps-icon/cps-icon.component';
import {
  CpsMenuComponent,
  CpsMenuItem
} from '../../../../cps-menu/cps-menu.component';

/**
 * TableRowMenuComponent is an internal component which applies the menu to each row.
 */
@Component({
  selector: 'table-row-menu',
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

  /**
   * Determines whether the 'Remove' button should be displayed in the menu.
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

  /**
   * Custom items to be displayed in the menu.
   * @group Props
   */
  @Input()
  set customItems(value: CpsMenuItem[] | undefined) {
    this._customRowMenuItems = value;
    this.initializeItems();
  }

  get customItems(): CpsMenuItem[] | undefined {
    return this._customRowMenuItems;
  }

  /**
   * Determines whether the 'Edit' button should be displayed in the menu.
   * @group Props
   */
  @Input()
  set showRowEditButton(value: boolean) {
    this._showRowEditButton = value;
    this.initializeItems();
  }

  get showRowEditButton(): boolean {
    return this._showRowEditButton;
  }

  private _showRowRemoveButton = true;
  private _showRowEditButton = true;
  private _customRowMenuItems?: CpsMenuItem[];

  items: CpsMenuItem[] = [];

  ngOnInit(): void {
    this.initializeItems();
  }

  initializeItems() {
    if (this._customRowMenuItems) {
      this.items = this._customRowMenuItems;
    } else {
      this.items = [];
      if (this.showRowEditButton) {
        this.items.push({
          title: 'Edit',
          icon: 'edit',
          action: (event: any) => {
            this.editRowBtnClicked.emit(event);
          }
        });
      }

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
}
