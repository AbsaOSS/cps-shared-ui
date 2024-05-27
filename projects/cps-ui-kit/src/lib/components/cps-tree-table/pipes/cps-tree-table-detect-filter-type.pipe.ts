import { Pipe, PipeTransform } from '@angular/core';
import { CpsColumnFilterType } from '../../cps-table/cps-column-filter-types';

@Pipe({
  name: 'cpsTTDetectFilterType',
  standalone: true
})
export class CpsTreeTableDetectFilterTypePipe implements PipeTransform {
  transform(
    nodes: { data: { [key: string]: unknown } }[],
    column: string
  ): CpsColumnFilterType {
    if (nodes.every((item) => typeof item.data[column] === 'boolean')) {
      return 'boolean';
    } else if (nodes.every((item) => typeof item.data[column] === 'number')) {
      return 'number';
    } else if (nodes.every((item) => item.data[column] instanceof Date)) {
      return 'date';
    } else if (
      nodes.reduce((acc, item) => acc.add(item.data[column]), new Set()).size <
      6
    ) {
      return 'category';
    }
    return 'text';
  }
}
