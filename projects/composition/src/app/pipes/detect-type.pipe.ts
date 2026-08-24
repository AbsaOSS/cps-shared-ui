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

// Finds known type names anywhere inside an arbitrarily nested type
// expression (e.g. the `CpsDialogConfig` inside `InjectionToken<CpsDialogConfig<any>>`,
// or the `CpsCronValidationService` inside `InjectionToken<CpsCronValidationService | null>`)
// and links just those identifiers, leaving the rest as plain text.
function linkifySegments(
  text: string,
  types: Record<string, string>
): TypeSegment[] {
  const identifierRe = /[A-Za-z_$][\w$]*/g;
  const segments: TypeSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = identifierRe.exec(text))) {
    const identifier = match[0];
    if (identifier in types) {
      if (match.index > lastIndex) {
        segments.push({ text: text.slice(lastIndex, match.index) });
      }
      segments.push({
        text: identifier,
        route: `/${types[identifier]}/api`,
        fragment: identifier
      });
      lastIndex = identifierRe.lastIndex;
    }
  }
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex) });
  }
  return segments.length > 0 ? segments : [{ text }];
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
      return { hasSeparator, segments: linkifySegments(typeName, types) };
    });

    if (isArray && groups.length > 0) {
      const lastGroup = groups[groups.length - 1];
      const lastSeg = lastGroup.segments[lastGroup.segments.length - 1];
      lastSeg.text += '[]';
    }
    return groups;
  }
}
