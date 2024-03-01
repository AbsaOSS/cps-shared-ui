import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, Scroll } from '@angular/router';
import { CpsTabChangeEvent } from 'cps-ui-kit';

@Component({
  template: ''
})
export abstract class ViewerComponent implements OnInit, AfterViewInit {
  private _route = inject(ActivatedRoute);
  private _router = inject(Router);
  protected selectedTabIndex = 0;

  ngOnInit(): void {
    if (!this._route.snapshot.params.type) {
      this._router.navigate(['./examples'], { relativeTo: this._route });
    }

    if (this._route.snapshot.params.type === 'examples') {
      this.selectedTabIndex = 0;
    } else if (this._route.snapshot.params.type === 'api') {
      this.selectedTabIndex = 1;
    }
  }

  changeTab(change: CpsTabChangeEvent): void {
    if (change.newIndex === 0) {
      this._router.navigate(['../examples'], { relativeTo: this._route });
    } else if (change.newIndex === 1) {
      this._router.navigate(['../api'], { relativeTo: this._route });
    }
  }

  ngAfterViewInit(): void {
    this._router.events.subscribe((event: any) => {
      if (event instanceof Scroll && event.anchor) {
        setTimeout(() => {
          this._scroll('#' + event.anchor);
        });
      }
    });
  }

  private _scroll(query: string) {
    const targetElement = document.querySelector(query);
    if (!targetElement) {
      window.scrollTo(0, 0);
    } else {
      targetElement.scrollIntoView();
      targetElement.classList.add('anchor-highlight');
      setTimeout(() => {
        targetElement.classList.remove('anchor-highlight');
      }, 500);
    }
  }
}
