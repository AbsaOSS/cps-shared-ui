import { Component } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, Scroll } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick
} from '@angular/core/testing';
import { Subject } from 'rxjs';
import { CpsTabChangeEvent } from 'cps-ui-kit';
import { ViewerComponent } from './viewer.component';

@Component({ template: '', standalone: false })
class TestViewerComponent extends ViewerComponent {}

describe('ViewerComponent', () => {
  let component: TestViewerComponent;
  let fixture: ComponentFixture<TestViewerComponent>;
  let routeParams$: Subject<Record<string, string>>;
  let routerEvents$: Subject<unknown>;
  let mockRouter: { navigate: jest.Mock; events: Subject<unknown> };
  let doc: Document;

  beforeEach(async () => {
    routeParams$ = new Subject();
    routerEvents$ = new Subject();

    mockRouter = { navigate: jest.fn(), events: routerEvents$ };

    await TestBed.configureTestingModule({
      declarations: [TestViewerComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { params: routeParams$.asObservable() }
        },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    doc = TestBed.inject(DOCUMENT);
    fixture = TestBed.createComponent(TestViewerComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('navigates to ./examples when no type param is present', () => {
      routeParams$.next({});
      expect(mockRouter.navigate).toHaveBeenCalledWith(['./examples'], {
        relativeTo: expect.any(Object)
      });
    });

    it('sets selectedTabIndex to 0 when type is "examples"', () => {
      routeParams$.next({ type: 'examples' });
      expect(
        (component as unknown as { selectedTabIndex: number }).selectedTabIndex
      ).toBe(0);
    });

    it('sets selectedTabIndex to 1 when type is "api"', () => {
      routeParams$.next({ type: 'api' });
      expect(
        (component as unknown as { selectedTabIndex: number }).selectedTabIndex
      ).toBe(1);
    });
  });

  describe('changeTab', () => {
    it('navigates to ../examples when newIndex is 0', () => {
      const change: CpsTabChangeEvent = { newIndex: 0, previousIndex: 1 };
      component.changeTab(change);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['../examples'], {
        relativeTo: expect.any(Object)
      });
    });

    it('navigates to ../api when newIndex is 1', () => {
      const change: CpsTabChangeEvent = { newIndex: 1, previousIndex: 0 };
      component.changeTab(change);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['../api'], {
        relativeTo: expect.any(Object)
      });
    });

    it('does not navigate for an unhandled tab index', () => {
      const change: CpsTabChangeEvent = { newIndex: 2, previousIndex: 0 };
      component.changeTab(change);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe('ngAfterViewInit', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('scrolls element into view and highlights it when anchor is found', fakeAsync(() => {
      const mockElement = doc.createElement('div');
      mockElement.scrollIntoView = jest.fn();
      jest.spyOn(doc, 'querySelector').mockReturnValue(mockElement);

      routerEvents$.next(
        new Scroll(null as unknown as NavigationEnd, null, 'my-section')
      );
      tick();

      expect(doc.querySelector).toHaveBeenCalledWith('#my-section');
      expect(mockElement.scrollIntoView).toHaveBeenCalled();
      expect(mockElement.classList.contains('anchor-highlight')).toBe(true);

      tick(500);
      expect(mockElement.classList.contains('anchor-highlight')).toBe(false);
    }));

    it('scrolls to top when anchor element is not found', fakeAsync(() => {
      jest.spyOn(doc, 'querySelector').mockReturnValue(null);
      const scrollToSpy = jest
        .spyOn(doc.defaultView as Window, 'scrollTo')
        .mockImplementation(() => {});

      routerEvents$.next(
        new Scroll(null as unknown as NavigationEnd, null, 'missing')
      );
      tick();

      expect(scrollToSpy).toHaveBeenCalledWith(0, 0);
    }));

    it('does not scroll when Scroll event has no anchor', fakeAsync(() => {
      const querySpy = jest.spyOn(doc, 'querySelector');

      routerEvents$.next(
        new Scroll(null as unknown as NavigationEnd, null, null)
      );
      tick();

      expect(querySpy).not.toHaveBeenCalled();
    }));

    it('does not scroll for non-Scroll router events', fakeAsync(() => {
      const querySpy = jest.spyOn(doc, 'querySelector');

      routerEvents$.next({ type: 'NavigationStart' });
      tick();

      expect(querySpy).not.toHaveBeenCalled();
    }));
  });
});
