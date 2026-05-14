import { Pipe, PipeTransform } from '@angular/core';

export interface TypeSegment {
  text: string;
  route?: string;
  fragment?: string;
}

@Pipe({ name: 'detectType', pure: true, standalone: true })
export class DetectTypePipe implements PipeTransform {
  public transform(
    value: string,
    types: Record<string, string>
  ): TypeSegment[] {
    if (!value) return [{ text: value }];
    const isArray = value.endsWith('[]');
    const base = isArray ? value.slice(0, -2) : value;

    const segments: TypeSegment[] = base.split('|').flatMap((part, i) => {
      const typeName = part.trim();
      const separator: TypeSegment[] = i > 0 ? [{ text: '|' }] : [];
      if (typeName in types) {
        return [
          ...separator,
          {
            text: typeName,
            route: `/${types[typeName]}/api`,
            fragment: typeName
          }
        ];
      }
      const genericMatch = typeName.match(/^([^<]+<)([\w$]+)(>.*)$/);
      if (genericMatch && genericMatch[2] in types) {
        const innerType = genericMatch[2];
        return [
          ...separator,
          { text: genericMatch[1] },
          {
            text: innerType,
            route: `/${types[innerType]}/api`,
            fragment: innerType
          },
          { text: genericMatch[3] }
        ];
      }
      return [...separator, { text: typeName }];
    });

    if (isArray) segments.push({ text: '[]' });
    return segments;
  }
}
