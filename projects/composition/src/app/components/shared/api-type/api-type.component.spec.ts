import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { ApiTypeComponent } from './api-type.component';

describe('ApiTypeComponent', () => {
  let component: ApiTypeComponent;
  let fixture: ComponentFixture<ApiTypeComponent>;

  const typesMap: Record<string, string> = {
    MyType: 'my-type',
    OtherType: 'other-type'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApiTypeComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(ApiTypeComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialisation', () => {
    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('renders one group with an empty span when type is empty', () => {
      fixture.detectChanges();
      const groups = fixture.debugElement.queryAll(By.css('.type-group'));
      expect(groups).toHaveLength(1);
      const span = fixture.debugElement.query(By.css('span.type-part'));
      expect(span.nativeElement.textContent.trim()).toBe('');
    });
  });

  describe('unknown / primitive type', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('type', 'string');
      fixture.componentRef.setInput('typesMap', typesMap);
      fixture.detectChanges();
    });

    it('renders one type-group', () => {
      const groups = fixture.debugElement.queryAll(By.css('.type-group'));
      expect(groups).toHaveLength(1);
    });

    it('renders a span.type-part (not a link) for an unknown type', () => {
      const span = fixture.debugElement.query(By.css('span.type-part'));
      expect(span).toBeTruthy();
      expect(span.nativeElement.textContent.trim()).toBe('string');
    });

    it('does not render an anchor for an unknown type', () => {
      const anchor = fixture.debugElement.query(By.css('a.type-part'));
      expect(anchor).toBeNull();
    });

    it('does not render a separator', () => {
      const sep = fixture.debugElement.query(By.css('.type-sep'));
      expect(sep).toBeNull();
    });
  });

  describe('known type', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('type', 'MyType');
      fixture.componentRef.setInput('typesMap', typesMap);
      fixture.detectChanges();
    });

    it('renders an anchor for a known type', () => {
      const anchor = fixture.debugElement.query(By.css('a.type-part'));
      expect(anchor).toBeTruthy();
      expect(anchor.nativeElement.textContent.trim()).toBe('MyType');
    });

    it('anchor href contains the correct route and fragment', () => {
      const anchor = fixture.debugElement.query(By.css('a.type-part'));
      const href: string = anchor.nativeElement.getAttribute('href');
      expect(href).toBe('/my-type/api#MyType');
    });

    it('does not render a plain span for a fully linked type', () => {
      const spans = fixture.debugElement.queryAll(By.css('span.type-part'));
      expect(spans).toHaveLength(0);
    });
  });

  describe('union types', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('type', 'string | MyType');
      fixture.componentRef.setInput('typesMap', typesMap);
      fixture.detectChanges();
    });

    it('renders two type-groups', () => {
      const groups = fixture.debugElement.queryAll(By.css('.type-group'));
      expect(groups).toHaveLength(2);
    });

    it('renders a separator before the second group', () => {
      const sep = fixture.debugElement.query(By.css('.type-sep'));
      expect(sep).toBeTruthy();
      expect(sep.nativeElement.textContent.trim()).toBe('|');
    });

    it('renders the first part as a plain span', () => {
      const span = fixture.debugElement.query(By.css('span.type-part'));
      expect(span.nativeElement.textContent.trim()).toBe('string');
    });

    it('renders the second part as an anchor', () => {
      const anchor = fixture.debugElement.query(By.css('a.type-part'));
      expect(anchor.nativeElement.textContent.trim()).toBe('MyType');
    });
  });

  describe('generic type with known inner type', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('type', 'Signal<MyType>');
      fixture.componentRef.setInput('typesMap', typesMap);
      fixture.detectChanges();
    });

    it('renders three type-part elements', () => {
      const parts = fixture.debugElement.queryAll(By.css('.type-part'));
      expect(parts).toHaveLength(3);
    });

    it('renders the wrapper prefix as a plain span', () => {
      const spans = fixture.debugElement.queryAll(By.css('span.type-part'));
      expect(spans[0].nativeElement.textContent.trim()).toBe('Signal<');
    });

    it('renders the inner known type as an anchor', () => {
      const anchor = fixture.debugElement.query(By.css('a.type-part'));
      expect(anchor.nativeElement.textContent.trim()).toBe('MyType');
    });

    it('renders the closing bracket as a plain span', () => {
      const spans = fixture.debugElement.queryAll(By.css('span.type-part'));
      expect(spans[1].nativeElement.textContent.trim()).toBe('>');
    });
  });

  describe('array type', () => {
    it('appends [] to the rendered text for an unknown array type', () => {
      fixture.componentRef.setInput('type', 'string[]');
      fixture.componentRef.setInput('typesMap', typesMap);
      fixture.detectChanges();
      const span = fixture.debugElement.query(By.css('span.type-part'));
      expect(span.nativeElement.textContent.trim()).toBe('string[]');
    });

    it('appends [] to the anchor text for a known array type', () => {
      fixture.componentRef.setInput('type', 'MyType[]');
      fixture.componentRef.setInput('typesMap', typesMap);
      fixture.detectChanges();
      const anchor = fixture.debugElement.query(By.css('a.type-part'));
      expect(anchor.nativeElement.textContent.trim()).toBe('MyType[]');
    });
  });
});
