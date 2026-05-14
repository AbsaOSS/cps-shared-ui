import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'detectType',
  pure: true,
  standalone: true
})
export class DetectTypePipe implements PipeTransform {
  public transform(
    value: string,
    types: Record<string, string>
  ): undefined | string {
    if (value.endsWith('[]')) {
      const baseType = value.slice(0, -2);
      return baseType in types ? baseType : undefined;
    } else {
      return value in types ? value : undefined;
    }
  }
}
