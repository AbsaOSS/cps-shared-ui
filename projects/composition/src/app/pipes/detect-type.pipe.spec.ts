import { DetectTypePipe } from './detect-type.pipe';

describe('DetectTypePipe', () => {
  let pipe: DetectTypePipe;
  const types: Record<string, string> = {
    MyType: 'my-type',
    OtherType: 'other-type'
  };

  beforeEach(() => {
    pipe = new DetectTypePipe();
  });

  describe('falsy/empty input', () => {
    it('should return a single plain segment when value is empty string', () => {
      const result = pipe.transform('', types);
      expect(result).toEqual([
        { hasSeparator: false, segments: [{ text: '' }] }
      ]);
    });
  });

  describe('primitive / unknown types', () => {
    it('should return a plain segment for an unknown type', () => {
      const result = pipe.transform('string', types);
      expect(result).toEqual([
        { hasSeparator: false, segments: [{ text: 'string' }] }
      ]);
    });

    it('should handle whitespace-padded unknown types', () => {
      const result = pipe.transform('  string  ', types);
      expect(result[0].segments[0].text).toBe('string');
    });
  });

  describe('known types — direct link', () => {
    it('should return a linked segment for a known type', () => {
      const result = pipe.transform('MyType', types);
      expect(result).toEqual([
        {
          hasSeparator: false,
          segments: [
            { text: 'MyType', route: '/my-type/api', fragment: 'MyType' }
          ]
        }
      ]);
    });
  });

  describe('array suffix', () => {
    it('should append [] to the last segment text for an unknown array type', () => {
      const result = pipe.transform('string[]', types);
      expect(result[0].segments[0].text).toBe('string[]');
    });

    it('should append [] to the last segment text for a known array type', () => {
      const result = pipe.transform('MyType[]', types);
      expect(result[0].segments[0].text).toBe('MyType[]');
    });
  });

  describe('union types', () => {
    it('should split a union into multiple groups', () => {
      const result = pipe.transform('string | number', types);
      expect(result).toHaveLength(2);
      expect(result[0].hasSeparator).toBe(false);
      expect(result[1].hasSeparator).toBe(true);
    });

    it('should mark the first group as hasSeparator: false', () => {
      const result = pipe.transform('string | number', types);
      expect(result[0].hasSeparator).toBe(false);
    });

    it('should mark subsequent groups as hasSeparator: true', () => {
      const result = pipe.transform('string | number | boolean', types);
      expect(result[1].hasSeparator).toBe(true);
      expect(result[2].hasSeparator).toBe(true);
    });

    it('should link a known type inside a union', () => {
      const result = pipe.transform('string | MyType', types);
      expect(result[1].segments[0]).toEqual({
        text: 'MyType',
        route: '/my-type/api',
        fragment: 'MyType'
      });
    });

    it('should not split a union inside angle brackets', () => {
      const result = pipe.transform('Promise<string | number>', types);
      expect(result).toHaveLength(1);
      expect(result[0].segments[0].text).toBe('Promise<string | number>');
    });

    it('should append [] only to the last segment of a union array', () => {
      const result = pipe.transform('string | number[]', types);
      expect(result[1].segments[0].text).toBe('number[]');
      expect(result[0].segments[0].text).toBe('string');
    });
  });

  describe('generic types', () => {
    it('should split a generic with a known inner type into three segments', () => {
      const result = pipe.transform('Signal<MyType>', types);
      expect(result[0].segments).toEqual([
        { text: 'Signal<' },
        { text: 'MyType', route: '/my-type/api', fragment: 'MyType' },
        { text: '>' }
      ]);
    });

    it('should return a plain segment for a generic with an unknown inner type', () => {
      const result = pipe.transform('Signal<string>', types);
      expect(result[0].segments).toEqual([{ text: 'Signal<string>' }]);
    });
  });
});
