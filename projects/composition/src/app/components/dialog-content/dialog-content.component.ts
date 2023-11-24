import { Component, OnInit } from '@angular/core';
import {
  CpsButtonComponent,
  CpsDialogConfig,
  CpsDialogRef,
  CpsIconComponent
} from 'cps-ui-kit';

@Component({
  standalone: true,
  imports: [CpsButtonComponent, CpsIconComponent],
  selector: 'app-dialog-content',
  templateUrl: './dialog-content.component.html',
  styleUrls: ['./dialog-content.component.scss']
})
export class DialogContentComponent implements OnInit {
  info = '';
  icon = '';

  closeDisabled = false;

  // eslint-disable-next-line no-useless-constructor
  constructor(
    private _dialogRef: CpsDialogRef,
    private _config: CpsDialogConfig
  ) {
    this.info = this._config.data.info;
    this.icon = this._config.data.icon;
  }

  ngOnInit(): void {
    this.closeDisabled = !!this._dialogRef.disableClose;
  }

  close(confirm: boolean) {
    this._dialogRef.close(confirm);
  }

  toggleDisableClose() {
    this.closeDisabled = !this.closeDisabled;
    this._dialogRef.disableClose = this.closeDisabled;
  }
}
