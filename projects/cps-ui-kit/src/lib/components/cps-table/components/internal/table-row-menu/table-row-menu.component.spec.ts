import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TableRowMenuComponent } from './table-row-menu.component';
import { CpsMenuItem } from '../../../../cps-menu/cps-menu.component';

describe('TableRowMenuComponent', () => {
  let component: TableRowMenuComponent;
  let fixture: ComponentFixture<TableRowMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableRowMenuComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(TableRowMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    document.body
      .querySelectorAll('.cps-menu-container')
      .forEach((el) => el.remove());
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('default values', () => {
    it('should default showRowEditButton to true', () => {
      expect(component.showRowEditButton).toBe(true);
    });

    it('should default showRowRemoveButton to true', () => {
      expect(component.showRowRemoveButton).toBe(true);
    });

    it('should default isMenuOpen to false', () => {
      expect(component.isMenuOpen).toBe(false);
    });

    it('should build both Edit and Remove items by default', () => {
      expect(component.items.length).toBe(2);
      expect(component.items[0].title).toBe('Edit');
      expect(component.items[1].title).toBe('Remove');
    });
  });

  describe('initializeItems', () => {
    it('should include only Remove when showRowEditButton is false', () => {
      fixture.componentRef.setInput('showRowEditButton', false);
      expect(component.items.length).toBe(1);
      expect(component.items[0].title).toBe('Remove');
    });

    it('should include only Edit when showRowRemoveButton is false', () => {
      fixture.componentRef.setInput('showRowRemoveButton', false);
      expect(component.items.length).toBe(1);
      expect(component.items[0].title).toBe('Edit');
    });

    it('should produce empty items when both buttons are hidden', () => {
      fixture.componentRef.setInput('showRowEditButton', false);
      fixture.componentRef.setInput('showRowRemoveButton', false);
      expect(component.items).toEqual([]);
    });

    it('should use customItems when provided, ignoring showRow flags', () => {
      const custom: CpsMenuItem[] = [{ title: 'Custom', icon: 'star' }];
      fixture.componentRef.setInput('showRowEditButton', false);
      fixture.componentRef.setInput('customItems', custom);
      expect(component.items).toEqual(custom);
    });

    it('should fall back to default items when customItems is cleared', () => {
      fixture.componentRef.setInput('customItems', [
        { title: 'Custom', icon: 'star' }
      ]);
      fixture.componentRef.setInput('customItems', undefined);
      expect(component.items.length).toBe(2);
      expect(component.items[0].title).toBe('Edit');
      expect(component.items[1].title).toBe('Remove');
    });
  });

  describe('onMenuShown / onMenuHidden', () => {
    it('should set isMenuOpen to true', () => {
      component.onMenuShown();
      expect(component.isMenuOpen).toBe(true);
    });

    it('should set isMenuOpen to false', () => {
      component.onMenuShown();
      component.onMenuHidden();
      expect(component.isMenuOpen).toBe(false);
    });
  });

  describe('editRowBtnClicked', () => {
    it('should emit when the Edit item action is invoked', () => {
      jest.spyOn(component.editRowBtnClicked, 'emit');
      const event = new MouseEvent('click');
      component.items.find((i) => i.title === 'Edit')!.action!(event);
      expect(component.editRowBtnClicked.emit).toHaveBeenCalledWith(event);
    });
  });

  describe('removeRowBtnClicked', () => {
    it('should emit when the Remove item action is invoked', () => {
      jest.spyOn(component.removeRowBtnClicked, 'emit');
      const event = new MouseEvent('click');
      component.items.find((i) => i.title === 'Remove')!.action!(event);
      expect(component.removeRowBtnClicked.emit).toHaveBeenCalledWith(event);
    });
  });

  describe('template', () => {
    it('should render the action button', () => {
      expect(
        fixture.nativeElement.querySelector('button.cps-table-row-menu-btn')
      ).toBeTruthy();
    });

    it('should set aria-label to "Row actions"', () => {
      const btn = fixture.nativeElement.querySelector('button');
      expect(btn.getAttribute('aria-label')).toBe('Row actions');
    });

    it('should set aria-haspopup to "menu"', () => {
      const btn = fixture.nativeElement.querySelector('button');
      expect(btn.getAttribute('aria-haspopup')).toBe('menu');
    });

    it('should set aria-expanded to false when menu is closed', () => {
      const btn = fixture.nativeElement.querySelector('button');
      expect(btn.getAttribute('aria-expanded')).toBe('false');
    });

    it('should set aria-expanded to true when menu is open', () => {
      component.onMenuShown();
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button');
      expect(btn.getAttribute('aria-expanded')).toBe('true');
    });
  });
});
