import { Pipe, PipeTransform } from '@angular/core';
import { isEqual } from 'lodash-es';
import { getOptionProp, OptionKey } from '../../utils/internal/option-utils';

@Pipe({ standalone: true, name: 'labelByValue' })
export class LabelByValuePipe implements PipeTransform {
  transform(
    value: any,
    options: any[],
    valueKey: OptionKey,
    labelKey: OptionKey
  ): string {
    const option = options.find((opt) =>
      isEqual(getOptionProp(opt, valueKey), value)
    );
    return option ? getOptionProp(option, labelKey) : '';
  }
}
