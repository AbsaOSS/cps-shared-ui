import { Pipe, PipeTransform } from '@angular/core';
import { isEqual } from 'lodash-es';

@Pipe({ standalone: true, name: 'checkOptionSelected' })
export class CheckOptionSelectedPipe implements PipeTransform {
  transform(
    option: any,
    value: any,
    multiple: boolean,
    returnObject: boolean,
    optionValue: string
  ): boolean {
    function includes(array: any[], val: any): boolean {
      return array?.some((item) => isEqual(item, val)) || false;
    }

    return multiple
      ? returnObject
        ? includes(value, option)
        : includes(value, option[optionValue])
      : returnObject
        ? isEqual(option, value)
        : isEqual(option[optionValue], value);
  }
}
