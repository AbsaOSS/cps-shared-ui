import { Component, effect, inject, NgZone, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import packageJson from 'projects/cps-ui-kit/package.json';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
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
  isMobile = false;

  showThemeToggle = false;

  version = packageJson?.version;

  private readonly _ngZone = inject(NgZone);
  private _mobileQuery?: MediaQueryList;

  constructor(
    private _router: Router,
    private _activatedRoute: ActivatedRoute
  ) {
    if (isPlatformBrowser(this._platformId)) {
      this._mobileQuery = window.matchMedia('(max-width: 37.5rem)');
      this.isMobile = this._mobileQuery.matches;
      this.sidebarExpanded = !this.isMobile;
      this._mobileQuery.addEventListener('change', (e) => {
        this._ngZone.run(() => {
          this.isMobile = e.matches;
          this.sidebarExpanded = !e.matches;
        });
      });
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
        map(() => this._activatedRoute?.firstChild?.snapshot?.routeConfig),
        distinctUntilChanged()
      )
      .subscribe((data: any) => {
        if (this.isMobile) this.sidebarExpanded = false;
        this.componentTitle = data?.title?.toUpperCase() || '';
        setTimeout(() => {
          (
            this._document.getElementById('main-content') as HTMLElement
          )?.focus();
        });
      });
  }

  toggleSidebar() {
    this.sidebarExpanded = !this.sidebarExpanded;
  }

  focusMainContent() {
    setTimeout(() => {
      (this._document.getElementById('main-content') as HTMLElement)?.focus();
    });
  }

  focusActiveNavItem(event: Event) {
    const activeItem =
      this._document.querySelector<HTMLElement>('.list-item._active');
    if (activeItem) {
      event.preventDefault();
      activeItem.focus();
    }
  }
}
