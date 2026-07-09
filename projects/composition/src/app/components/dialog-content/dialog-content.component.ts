import { Component, Inject, OnInit } from '@angular/core';
import {
  CPS_DIALOG_CONFIG,
  CpsButtonComponent,
  CpsDialogRef,
  CpsIconComponent,
  type CpsDialogConfig
} from 'cps-ui-kit';

@Component({
  imports: [CpsButtonComponent, CpsIconComponent],
  selector: 'app-dialog-content',
  templateUrl: './dialog-content.component.html',
  styleUrls: ['./dialog-content.component.scss']
})
export class DialogContentComponent implements OnInit {
  info = '';
  icon = '';

  closeDisabled = false;

  constructor(
    private _dialogRef: CpsDialogRef,
    @Inject(CPS_DIALOG_CONFIG) private _config: CpsDialogConfig
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
