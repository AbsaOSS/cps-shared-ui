import { Component } from '@angular/core';
import { CpsTextareaComponent } from 'cps-ui-kit';

@Component({
  standalone: true,
  selector: 'app-textarea-page',
  imports: [CpsTextareaComponent],
  templateUrl: './textarea-page.component.html',
  styleUrls: ['./textarea-page.component.scss'],
  host: { class: 'composition-page' }
})
export class TextareaPageComponent {}
