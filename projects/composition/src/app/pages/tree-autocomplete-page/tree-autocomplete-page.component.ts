import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CpsTreeAutocompleteComponent } from 'cps-ui-kit';

@Component({
  selector: 'app-tree-autocomplete-page',
  standalone: true,
  imports: [CpsTreeAutocompleteComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './tree-autocomplete-page.component.html',
  styleUrls: ['./tree-autocomplete-page.component.scss'],
  host: { class: 'composition-page' }
})
export class TreeAutocompletePageComponent {}
