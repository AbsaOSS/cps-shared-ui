import { Component } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  componentTitle = '';
  constructor (
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
}
