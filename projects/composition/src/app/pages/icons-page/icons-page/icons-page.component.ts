import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CpsIconComponent, CpsInputComponent, iconNames } from 'cps-ui-kit';

@Component({
  standalone: true,
  imports: [CpsIconComponent, CpsInputComponent, CommonModule, FormsModule],
  selector: 'app-icons-page',
  templateUrl: './icons-page.component.html',
  styleUrls: ['./icons-page.component.scss'],
  host: { class: 'composition-page' },
})
export class IconsPageComponent implements OnInit {
  filteredIconsList = [] as string[];

  ngOnInit() {
    this.filteredIconsList = iconNames;
  }

  onSearchChanged(value: string) {
    this._filterIcons(value);
  }

  private _filterIcons(name: string) {
    name = name.toLowerCase();
    this.filteredIconsList = iconNames.filter((n) =>
      n.toLowerCase().includes(name)
    );
  }

  onCopyIconName(name: string) {
    navigator.clipboard.writeText(name).then(
      () => {
        console.log('Content copied to clipboard');
      },
      () => {
        console.error('Failed to copy icon name to clickboard');
      }
    );
  }
}
