import { Pipe, PipeTransform } from '@angular/core';
import { isEqual } from 'lodash-es';

@Pipe({ standalone: true, name: 'labelByValue' })
export class LabelByValuePipe implements PipeTransform {
  transform(
    value: any,
    options: any[],
    valueKey: string,
    labelKey: string
  ): string {
    const option = options.find((opt) => isEqual(opt[valueKey], value));
    return option ? option[labelKey] : 'unknown';
  }
}
