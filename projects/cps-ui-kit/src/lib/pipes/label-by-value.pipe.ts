import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ standalone: true, name: 'labelByValue' })
export class LabelByValuePipe implements PipeTransform {
  transform (
    value: string,
    options: any[],
    valueKey: string,
    labelKey: string
  ): string {
    const option = options.find((opt) => opt[valueKey] === value);
    return option ? option[labelKey] : 'unknown';
  }
}
