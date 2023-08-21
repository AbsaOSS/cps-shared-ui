import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CpsSidebarMenuComponent } from 'cps-ui-kit';

@Component({
  selector: 'app-sidebar-menu-page',
  standalone: true,
  imports: [CommonModule, CpsSidebarMenuComponent],
  templateUrl: './sidebar-menu-page.component.html',
  styleUrls: ['./sidebar-menu-page.component.scss']
})
export class SidebarMenuPageComponent {}
