import { Pipe, PipeTransform } from '@angular/core';

export interface TypeLink {
  type: string;
  rest: string;
}

@Pipe({
  name: 'detectType',
  pure: true,
  standalone: true
})
export class DetectTypePipe implements PipeTransform {
  public transform(
    value: string,
    types: Record<string, string>
  ): TypeLink | null {
    if (!value) return null;
    if (value in types) return { type: value, rest: '' };
    if (value.endsWith('[]')) {
      const base = value.slice(0, -2);
      if (base in types) return { type: base, rest: '[]' };
    }
    const parts = value.split('|').map((p) => p.trim());
    const matched = parts.find((p) => p in types);
    if (!matched) return null;
    const rest = ' | ' + parts.filter((p) => p !== matched).join(' | ');
    return { type: matched, rest };
  }
}
