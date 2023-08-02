import { Component, EventEmitter, Output } from '@angular/core';
import { CpsIconComponent } from '../../cps-icon/cps-icon.component';
import {
  CpsMenuComponent,
  CpsMenuItem
} from '../../cps-menu/cps-menu.component';

@Component({
  selector: 'table-row-menu',
  standalone: true,
  imports: [CpsIconComponent, CpsMenuComponent],
  templateUrl: './table-row-menu.component.html',
  styleUrls: ['./table-row-menu.component.scss']
})
export class TableRowMenuComponent {
  @Output() editRowBtnClicked = new EventEmitter<any>();
  @Output() removeRowBtnClicked = new EventEmitter<any>();

  items = [
    {
      title: 'Edit',
      icon: 'edit',
      action: (event: any) => {
        this.editRowBtnClicked.emit(event);
      }
    },
    {
      title: 'Remove',
      icon: 'remove',
      action: (event: any) => {
        this.removeRowBtnClicked.emit(event);
      }
    }
  ] as CpsMenuItem[];
}