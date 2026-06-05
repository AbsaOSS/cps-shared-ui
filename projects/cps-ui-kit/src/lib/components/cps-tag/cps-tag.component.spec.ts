import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CpsTagComponent } from './cps-tag.component';
import { FormsModule } from '@angular/forms';

describe('CpsTagComponent', () => {
  let component: CpsTagComponent;
  let fixture: ComponentFixture<CpsTagComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CpsTagComponent, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(CpsTagComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('label', 'Tag');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.color).toBe('calm');
    expect(component.disabled).toBe(false);
    expect(component.selectable).toBe(false);
    expect(component.value).toBe(false);
    expect(component.pressing).toBe(false);
  });

  it('should render label', () => {
    fixture.componentRef.setInput('label', 'Test Tag');
    fixture.detectChanges();
    const tag = fixture.nativeElement.querySelector('span');
    expect(tag.textContent).toContain('Test Tag');
  });

  it('should add selectable class when selectable', () => {
    fixture.componentRef.setInput('selectable', true);
    fixture.detectChanges();
    expect(component.classesList).toContain('cps-tag--selectable');
  });

  it('should add disabled class when disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(component.classesList).toContain('cps-tag--disabled');
  });

  it('should toggle value when clicked and selectable', () => {
    component.selectable = true;
    expect(component.value).toBe(false);
    component.toggleSelected();
    expect(component.value).toBe(true);
  });

  it('should not toggle when disabled', () => {
    component.selectable = true;
    component.disabled = true;
    component.value = false;
    component.toggleSelected();
    expect(component.value).toBe(false);
  });

  it('should not toggle when not selectable', () => {
    component.selectable = false;
    component.value = false;
    component.toggleSelected();
    expect(component.value).toBe(false);
  });

  it('should emit valueChanged event when value changes', () => {
    jest.spyOn(component.valueChanged, 'emit');
    component.selectable = true;
    component.toggleSelected();
    expect(component.valueChanged.emit).toHaveBeenCalledWith(true);
  });

  it('should write value through ControlValueAccessor', () => {
    component.writeValue(true);
    expect(component.value).toBe(true);
  });

  it('should register onChange callback properly', () => {
    const fn = jest.fn();
    component.registerOnChange(fn);
    component.selectable = true;
    component.toggleSelected();
    expect(fn).toHaveBeenCalled();
  });

  it('should register onTouched callback', () => {
    const fn = jest.fn();
    component.registerOnTouched(fn);
    expect(component.onTouched).toBe(fn);
  });

  it('should always have base class', () => {
    fixture.componentRef.setInput('color', 'calm');
    fixture.detectChanges();
    expect(component.classesList).toContain('cps-tag');
  });

  it('should call setClasses on ngOnChanges', () => {
    const spy = jest.spyOn(component, 'setClasses');
    fixture.componentRef.setInput('selectable', true);
    fixture.detectChanges();
    expect(spy).toHaveBeenCalled();
  });

  it('should set custom color', () => {
    fixture.componentRef.setInput('color', 'primary');
    fixture.detectChanges();
    expect(component.color).toBeTruthy();
  });

  it('should toggle from true to false', () => {
    component.selectable = true;
    component.value = true;
    component.toggleSelected();
    expect(component.value).toBe(false);
  });

  it('should call onChange when value is set after registration', () => {
    const fn = jest.fn();
    component.registerOnChange(fn);
    component.value = true;
    expect(fn).toHaveBeenCalledWith(true);
  });

  describe('ARIA attributes', () => {
    it('should set role="checkbox" when selectable', () => {
      fixture.componentRef.setInput('selectable', true);
      fixture.detectChanges();
      const div = fixture.nativeElement.querySelector('div');
      expect(div.getAttribute('role')).toBe('checkbox');
    });

    it('should not set role when not selectable', () => {
      fixture.detectChanges();
      const div = fixture.nativeElement.querySelector('div');
      expect(div.getAttribute('role')).toBeNull();
    });

    it('should set aria-checked to false when selectable and not selected', () => {
      fixture.componentRef.setInput('selectable', true);
      fixture.detectChanges();
      const div = fixture.nativeElement.querySelector('div');
      expect(div.getAttribute('aria-checked')).toBe('false');
    });

    it('should set aria-checked to true when selectable and selected', () => {
      fixture.componentRef.setInput('selectable', true);
      fixture.detectChanges();
      component.selectable = true;
      component.toggleSelected();
      fixture.detectChanges();
      const div = fixture.nativeElement.querySelector('div');
      expect(div.getAttribute('aria-checked')).toBe('true');
    });

    it('should not set aria-checked when not selectable', () => {
      fixture.detectChanges();
      const div = fixture.nativeElement.querySelector('div');
      expect(div.getAttribute('aria-checked')).toBeNull();
    });

    it('should set aria-disabled when selectable and disabled', () => {
      fixture.componentRef.setInput('selectable', true);
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      const div = fixture.nativeElement.querySelector('div');
      expect(div.getAttribute('aria-disabled')).toBe('true');
    });

    it('should not set aria-disabled when not disabled', () => {
      fixture.componentRef.setInput('selectable', true);
      fixture.detectChanges();
      const div = fixture.nativeElement.querySelector('div');
      expect(div.getAttribute('aria-disabled')).toBeNull();
    });

    it('should not set aria-disabled on non-selectable tags', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      const div = fixture.nativeElement.querySelector('div');
      expect(div.getAttribute('aria-disabled')).toBeNull();
    });
  });

  describe('tabindex', () => {
    it('should set tabindex="0" when selectable and not disabled', () => {
      fixture.componentRef.setInput('selectable', true);
      fixture.detectChanges();
      const div = fixture.nativeElement.querySelector('div');
      expect(div.getAttribute('tabindex')).toBe('0');
    });

    it('should set tabindex="-1" when selectable and disabled', () => {
      fixture.componentRef.setInput('selectable', true);
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      const div = fixture.nativeElement.querySelector('div');
      expect(div.getAttribute('tabindex')).toBe('-1');
    });

    it('should not set tabindex when not selectable', () => {
      fixture.detectChanges();
      const div = fixture.nativeElement.querySelector('div');
      expect(div.getAttribute('tabindex')).toBeNull();
    });
  });

  describe('keyboard interaction', () => {
    beforeEach(() => {
      component.selectable = true;
    });

    it('should toggle on Enter keydown', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true
      });
      component.handleEnterKeydown(event);
      expect(component.value).toBe(true);
    });

    it('should not toggle on repeated Enter keydown', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        repeat: true,
        bubbles: true
      });
      component.handleEnterKeydown(event);
      expect(component.value).toBe(false);
    });

    it('should prevent default on Enter keydown', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true
      });
      jest.spyOn(event, 'preventDefault');
      component.handleEnterKeydown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should set pressing=true on Space keydown', () => {
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
      component.handleSpaceKeydown(event);
      expect(component.pressing).toBe(true);
    });

    it('should not toggle on Space keydown', () => {
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
      component.handleSpaceKeydown(event);
      expect(component.value).toBe(false);
    });

    it('should prevent default on Space keydown', () => {
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
      jest.spyOn(event, 'preventDefault');
      component.handleSpaceKeydown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should toggle and clear pressing on toggleSelected (Space keyup)', () => {
      component.pressing = true;
      component.toggleSelected();
      expect(component.value).toBe(true);
      expect(component.pressing).toBe(false);
    });

    it('should clear pressing even when disabled', () => {
      component.disabled = true;
      component.pressing = true;
      component.toggleSelected();
      expect(component.pressing).toBe(false);
      expect(component.value).toBe(false);
    });
  });

  describe('_logMissingLabelError', () => {
    let errorFixture: ComponentFixture<CpsTagComponent>;
    let errorComponent: CpsTagComponent;

    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      errorFixture = TestBed.createComponent(CpsTagComponent);
      errorComponent = errorFixture.componentInstance;
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should log error on init when label is empty', () => {
      errorFixture.detectChanges();
      expect(console.error).toHaveBeenCalledWith(
        'CpsTagComponent: the tag must have a label.'
      );
    });

    it('should log error on init when label is whitespace only', () => {
      errorFixture.componentRef.setInput('label', '   ');
      errorFixture.detectChanges();
      expect(console.error).toHaveBeenCalledWith(
        'CpsTagComponent: the tag must have a label.'
      );
    });

    it('should not log error when label is set', () => {
      errorFixture.componentRef.setInput('label', 'Tag');
      errorFixture.detectChanges();
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should log error on ngOnChanges when label becomes empty', () => {
      errorFixture.componentRef.setInput('label', 'Tag');
      errorFixture.detectChanges();
      jest.clearAllMocks();
      errorFixture.componentRef.setInput('label', '');
      errorFixture.detectChanges();
      expect(console.error).toHaveBeenCalledWith(
        'CpsTagComponent: the tag must have a label.'
      );
    });

    it('should not set errorComponent label', () => {
      expect(errorComponent.label).toBe('');
    });
  });
});
