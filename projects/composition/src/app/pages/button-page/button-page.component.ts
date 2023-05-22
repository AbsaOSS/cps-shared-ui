import { Component } from '@angular/core';
import { CpsButtonComponent } from 'cps-ui-kit';

@Component({
  standalone: true,
  imports: [CpsButtonComponent],
  selector: 'app-button-page',
  templateUrl: './button-page.component.html',
  styleUrls: ['./button-page.component.scss'],
  host: { class: 'composition-page' }
})
export class ButtonPageComponent {
  isLoading = false;
  onClickForLoading() {
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
    }, 2000);
  }
}
