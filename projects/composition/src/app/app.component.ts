import { Component, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import packageJson from 'projects/cps-ui-kit/package.json';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false
})
export class AppComponent {
  private readonly _platformId = inject(PLATFORM_ID);

  componentTitle = '';

  sidebarExpanded = false;

  showThemeToggle = false;

  version = packageJson?.version;

  constructor(
    private _router: Router,
    private _activatedRoute: ActivatedRoute
  ) {
    if (isPlatformBrowser(this._platformId)) {
      this.sidebarExpanded = window.innerWidth >= 600;
      this.showThemeToggle =
        new URLSearchParams(window.location.search).get('experimental') ===
        'true';
    }
    this._router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => this._activatedRoute),
        map((route) => route?.firstChild),
        map((route) => route?.snapshot?.routeConfig)
      )
      .subscribe((data: any) => {
        this.componentTitle = data?.title?.toUpperCase() || '';
      });
  }

  toggleSidebar() {
    this.sidebarExpanded = !this.sidebarExpanded;
  }
}
