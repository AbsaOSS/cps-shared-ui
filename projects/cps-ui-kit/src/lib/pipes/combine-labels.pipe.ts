import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ standalone: true, name: 'combineLabels' })
export class CombineLabelsPipe implements PipeTransform {
  transform(
    values: any[],
    options: any[],
    valueKey: string,
    labelKey: string,
    returnObject: boolean
  ): string {
    return values
      .map((v) => {
        if (returnObject) {
          return v[labelKey];
        } else {
          const option = options.find((opt) => opt[valueKey] === v);
          return option ? option[labelKey] : 'unknown';
        }
      })
      .join(', ');
  }
}
