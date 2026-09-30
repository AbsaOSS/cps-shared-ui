import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';

export const defaultTabRedirectGuard: CanMatchFn = (_route, segments) => {
  if (segments.length !== 1) {
    return true;
  }

  const router = inject(Router);
  const path = segments.map((segment) => segment.path).join('/');
  return router.parseUrl(`/${path}/examples`);
};
