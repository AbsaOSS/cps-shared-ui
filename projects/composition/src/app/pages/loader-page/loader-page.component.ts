import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CpsButtonComponent, CpsLoaderComponent } from 'cps-ui-kit';

@Component({
  standalone: true,
  imports: [CommonModule, CpsLoaderComponent, CpsButtonComponent],
  selector: 'app-loader-page',
  templateUrl: './loader-page.component.html',
  styleUrls: ['./loader-page.component.scss'],
  host: { class: 'composition-page' }
})
export class LoaderPageComponent {
  fullScreenOpened = false;
  onFullScreenClick() {
    this.fullScreenOpened = true;
    setTimeout(() => {
      this.fullScreenOpened = false;
    }, 3000);
  }
}
