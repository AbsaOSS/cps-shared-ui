import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CpsTabChangeEvent } from 'cps-ui-kit';

@Component({
  template: ''
})
export abstract class ViewerComponent implements OnInit {
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
}

// TODO: Add scrolling to †he type
