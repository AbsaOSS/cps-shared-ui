import { Pipe, PipeTransform } from '@angular/core';

interface TypeSegment {
  text: string;
  route?: string;
  fragment?: string;
}

interface TypeGroup {
  hasSeparator: boolean;
  segments: TypeSegment[];
}

function splitTopLevelUnion(value: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of value) {
    if ('<({['.includes(char)) depth++;
    else if ('>)}]'.includes(char)) depth--;
    if (char === '|' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts;
}

@Pipe({ name: 'detectType', pure: true })
export class DetectTypePipe implements PipeTransform {
  public transform(value: string, types: Record<string, string>): TypeGroup[] {
    if (!value) return [{ hasSeparator: false, segments: [{ text: value }] }];
    const isArray = value.endsWith('[]');
    const base = isArray ? value.slice(0, -2) : value;

    const groups: TypeGroup[] = splitTopLevelUnion(base).map((part, i) => {
      const typeName = part.trim();
      const hasSeparator = i > 0;
      if (typeName in types) {
        return {
          hasSeparator,
          segments: [
            {
              text: typeName,
              route: `/${types[typeName]}/api`,
              fragment: typeName
            }
          ]
        };
      }
      const genericMatch = typeName.match(/^([^<]+<)([\w$]+)(>.*)$/);
      if (genericMatch && genericMatch[2] in types) {
        const innerType = genericMatch[2];
        return {
          hasSeparator,
          segments: [
            { text: genericMatch[1] },
            {
              text: innerType,
              route: `/${types[innerType]}/api`,
              fragment: innerType
            },
            { text: genericMatch[3] }
          ]
        };
      }
      return { hasSeparator, segments: [{ text: typeName }] };
    });

    if (isArray && groups.length > 0) {
      const lastGroup = groups[groups.length - 1];
      const lastSeg = lastGroup.segments[lastGroup.segments.length - 1];
      lastSeg.text += '[]';
    }
    return groups;
  }
}
