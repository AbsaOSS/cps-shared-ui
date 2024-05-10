import { Pipe, PipeTransform } from '@angular/core';
import { CpsColumnFilterType } from '../cps-column-filter-types';

@Pipe({
  name: 'cpsDetectFilterType',
  standalone: true
})
export class CpsDetectFilterTypePipe implements PipeTransform {
  transform(
    data: { [key: string]: unknown }[],
    column: string
  ): CpsColumnFilterType {
    if (data.every((item) => typeof item[column] === 'boolean')) {
      return 'boolean';
    } else if (data.every((item) => typeof item[column] === 'number')) {
      return 'number';
    } else if (data.every((item) => item[column] instanceof Date)) {
      return 'date';
    } else if (
      data.reduce((acc, item) => acc.add(item[column]), new Set()).size < 6
    ) {
      return 'category';
    }
    return 'text';
  }
}
