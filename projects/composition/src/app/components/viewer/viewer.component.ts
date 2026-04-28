import { AfterViewInit, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, Scroll } from '@angular/router';
import { CpsTabChangeEvent } from 'cps-ui-kit';
import { DOCUMENT } from '@angular/common';

@Component({
  template: '',
  standalone: false
})
export abstract class ViewerComponent implements OnInit, AfterViewInit {
  private _route = inject(ActivatedRoute);
  private _router = inject(Router);
  private _document = inject(DOCUMENT);
  private _destroyRef = inject(DestroyRef);
  protected selectedTabIndex = 0;

  ngOnInit(): void {
    this._route.params.pipe(takeUntilDestroyed(this._destroyRef)).subscribe((params) => {
      if (!params['type']) {
        this._router.navigate(['./examples'], { relativeTo: this._route });
        return;
      }
      if (params['type'] === 'examples') {
        this.selectedTabIndex = 0;
      } else if (params['type'] === 'api') {
        this.selectedTabIndex = 1;
      }
    });
  }

  changeTab(change: CpsTabChangeEvent): void {
    if (change.newIndex === 0) {
      this._router.navigate(['../examples'], { relativeTo: this._route });
    } else if (change.newIndex === 1) {
      this._router.navigate(['../api'], { relativeTo: this._route });
    }
  }

  ngAfterViewInit(): void {
    this._router.events.pipe(takeUntilDestroyed(this._destroyRef)).subscribe((event: any) => {
      if (event instanceof Scroll && event.anchor) {
        setTimeout(() => {
          this._scroll('#' + event.anchor);
        });
      }
    });
  }

  private _scroll(query: string) {
    const targetElement = this._document.querySelector(query);
    if (!targetElement) {
      (this._document.defaultView as Window).scrollTo(0, 0);
    } else {
      targetElement.scrollIntoView();
      targetElement.classList.add('anchor-highlight');
      setTimeout(() => {
        targetElement.classList.remove('anchor-highlight');
      }, 500);
    }
  }
}
