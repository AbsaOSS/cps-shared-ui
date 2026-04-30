import { Component, effect, inject, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import packageJson from 'projects/cps-ui-kit/package.json';
import { filter, map } from 'rxjs/operators';
import { CpsThemeService } from 'cps-ui-kit';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false
})
export class AppComponent {
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _document = inject(DOCUMENT);
  private readonly _themeService = inject(CpsThemeService);

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

    effect(() => {
      const theme = this._themeService.isDark()
        ? 'atom-one-dark'
        : 'atom-one-light';
      let link = this._document.getElementById(
        'hljs-theme'
      ) as HTMLLinkElement | null;
      if (!link) {
        link = this._document.createElement('link');
        link.id = 'hljs-theme';
        link.rel = 'stylesheet';
        this._document.head.appendChild(link);
      }
      link.href = `hljs-themes/${theme}.min.css`;
    });

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
