import { Component } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import packageJson from 'projects/cps-ui-kit/package.json';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false
})
export class AppComponent {
  componentTitle = '';

  sidebarExpanded = true;

  version = packageJson?.version;

  constructor(
    private _router: Router,
    private _activatedRoute: ActivatedRoute
  ) {
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
