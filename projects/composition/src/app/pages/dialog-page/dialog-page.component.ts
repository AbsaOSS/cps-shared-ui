import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CpsDialogService } from 'cps-ui-kit';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-dialog-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dialog-page.component.html',
  styleUrls: ['./dialog-page.component.scss'],
  providers: [CpsDialogService],
  host: { class: 'composition-page' }
})
export class DialogPageComponent {
  ref: DynamicDialogRef | undefined;

  // eslint-disable-next-line no-useless-constructor
  constructor(public dialogService: CpsDialogService) {}
}
