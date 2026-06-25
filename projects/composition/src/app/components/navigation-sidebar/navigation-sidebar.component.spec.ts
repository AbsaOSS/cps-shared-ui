import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { NavigationSidebarComponent } from './navigation-sidebar.component';

describe('NavigationSidebarComponent', () => {
  let component: NavigationSidebarComponent;
  let fixture: ComponentFixture<NavigationSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationSidebarComponent],
      providers: [provideRouter([]), provideNoopAnimations()]
    }).compileComponents();

    fixture = TestBed.createComponent(NavigationSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('isExpanded', () => {
    it('does not add sidebar-collapsed class by default', () => {
      const sidebar = fixture.debugElement.query(By.css('.sidebar'));
      expect(sidebar.classes['sidebar-collapsed']).toBeFalsy();
    });

    it('adds sidebar-collapsed class when set to false', () => {
      component.isExpanded = false;
      fixture.detectChanges();
      const sidebar = fixture.debugElement.query(By.css('.sidebar'));
      expect(sidebar.classes['sidebar-collapsed']).toBe(true);
    });
  });

  describe('ngOnInit', () => {
    it('populates filteredComponents with all components', () => {
      const allCount = (component as any)._components.length;
      expect(component.filteredComponents.length).toBe(allCount);
    });
  });

  describe('onSearchChanged', () => {
    it('filters components by title case-insensitively', () => {
      component.onSearchChanged('BUTTON');
      expect(
        component.filteredComponents.every((c) =>
          c.title.toLowerCase().includes('button')
        )
      ).toBe(true);
      expect(component.filteredComponents.length).toBeGreaterThan(0);
    });

    it('matches partial title substrings', () => {
      component.onSearchChanged('select');
      const titles = component.filteredComponents.map((c) => c.title);
      expect(titles).toContain('Select');
      expect(titles).toContain('Tree select');
    });

    it('restores all components when search string is cleared', () => {
      const allCount = (component as any)._components.length;
      component.onSearchChanged('button');
      component.onSearchChanged('');
      expect(component.filteredComponents.length).toBe(allCount);
    });

    it('returns empty array when no component matches', () => {
      component.onSearchChanged('zzznomatch');
      expect(component.filteredComponents).toEqual([]);
    });
  });

  describe('onLinkClick', () => {
    it('emits linkClicked', () => {
      const spy = jest.spyOn(component.linkClicked, 'emit');
      component.onLinkClick();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('resets searchVal and restores filteredComponents when search was active', () => {
      component.searchVal = 'button';
      component.filteredComponents = [(component as any)._components[1]];
      const allCount = (component as any)._components.length;

      component.onLinkClick();

      expect(component.searchVal).toBe('');
      expect(component.filteredComponents.length).toBe(allCount);
    });

    it('does not recreate filteredComponents when search was already empty', () => {
      const originalRef = component.filteredComponents;
      component.onLinkClick();
      expect(component.filteredComponents).toBe(originalRef);
    });

    it('still emits linkClicked even when search was empty', () => {
      const spy = jest.spyOn(component.linkClicked, 'emit');
      component.searchVal = '';
      component.onLinkClick();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('focusActiveLink', () => {
    it('focuses the link that has aria-current="page"', () => {
      const links = fixture.debugElement.queryAll(By.css('.list-item'));
      const target = links[0].nativeElement as HTMLElement;
      target.setAttribute('aria-current', 'page');
      jest.spyOn(target, 'focus');

      component.focusActiveLink();

      expect(target.focus).toHaveBeenCalled();
    });

    it('does nothing when no link has aria-current="page"', () => {
      const spies = fixture.debugElement
        .queryAll(By.css('.list-item'))
        .map((el) => jest.spyOn(el.nativeElement, 'focus'));

      component.focusActiveLink();

      spies.forEach((spy) => expect(spy).not.toHaveBeenCalled());
    });
  });

  describe('template', () => {
    it('renders nav with Main navigation aria-label', () => {
      const nav = fixture.debugElement.query(By.css('nav'));
      expect(nav.attributes['aria-label']).toBe('Main navigation');
    });

    it('renders links for all filteredComponents plus one styles link', () => {
      const links = fixture.debugElement.queryAll(By.css('.list-item'));
      expect(links.length).toBe(1 + component.filteredComponents.length);
    });

    it('updates link count after filtering', () => {
      component.onSearchChanged('input');
      fixture.detectChanges();
      const links = fixture.debugElement.queryAll(By.css('.list-item'));
      expect(links.length).toBe(1 + component.filteredComponents.length);
    });

    it('restores link count after clearing search', () => {
      const totalBefore = fixture.debugElement.queryAll(
        By.css('.list-item')
      ).length;
      component.onSearchChanged('button');
      fixture.detectChanges();
      component.onSearchChanged('');
      fixture.detectChanges();
      const totalAfter = fixture.debugElement.queryAll(
        By.css('.list-item')
      ).length;
      expect(totalAfter).toBe(totalBefore);
    });
  });
});
