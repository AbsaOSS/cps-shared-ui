import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CpsTagComponent } from 'cps-ui-kit';

@Component({
  standalone: true,
  imports: [CpsTagComponent, ReactiveFormsModule, FormsModule],
  selector: 'app-tag-page',
  templateUrl: './tag-page.component.html',
  styleUrls: ['./tag-page.component.scss'],
  host: { class: 'composition-page' }
})
export class TagPageComponent {
  syncVal = true;
}
