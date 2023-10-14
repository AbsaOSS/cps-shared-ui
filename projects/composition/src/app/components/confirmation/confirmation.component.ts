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
  selector: 'app-confirmation',
  templateUrl: './confirmation.component.html',
  styleUrls: ['./confirmation.component.scss']
})
export class ConfirmationComponent implements OnInit {
  subtitle = '';

  // eslint-disable-next-line no-useless-constructor
  constructor(
    private _dialogRef: CpsDialogRef,
    public config: CpsDialogConfig
  ) {
    this.subtitle = config.data.subtitle;
  }

  ngOnInit(): void {}

  close(confirm: boolean) {
    this._dialogRef.close(confirm);
  }
}
