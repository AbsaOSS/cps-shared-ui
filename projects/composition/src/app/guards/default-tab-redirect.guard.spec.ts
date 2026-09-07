import { TestBed } from '@angular/core/testing';
import { Route, Router, UrlSegment, UrlTree } from '@angular/router';
import { defaultTabRedirectGuard } from './default-tab-redirect.guard';

describe('defaultTabRedirectGuard', () => {
  let mockRouter: { parseUrl: jest.Mock };

  beforeEach(() => {
    mockRouter = {
      parseUrl: jest.fn((url: string) => ({ url }) as unknown as UrlTree)
    };

    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: mockRouter }]
    });
  });

  function runGuard(segments: string[]) {
    const urlSegments = segments.map((path) => new UrlSegment(path, {}));
    return TestBed.runInInjectionContext(() =>
      defaultTabRedirectGuard({} as Route, urlSegments, undefined as never)
    );
  }

  it('allows matching when more than one segment is present', () => {
    const result = runGuard(['checkbox', 'examples']);
    expect(result).toBe(true);
    expect(mockRouter.parseUrl).not.toHaveBeenCalled();
  });

  it('redirects to the examples tab when only the bare segment is present', () => {
    runGuard(['checkbox']);
    expect(mockRouter.parseUrl).toHaveBeenCalledWith('/checkbox/examples');
  });
});
