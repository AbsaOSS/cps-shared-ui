import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterModule, CommonModule],
  selector: 'app-navigation-sidebar',
  templateUrl: './navigation-sidebar.component.html',
  styleUrls: ['./navigation-sidebar.component.scss'],
})
export class NavigationSidebarComponent {
  components = [
    {
      title: 'Input',
      url: '/input',
    },
    {
      title: 'Icons',
      url: '/icons',
    },
    // extend this list
  ];
}
