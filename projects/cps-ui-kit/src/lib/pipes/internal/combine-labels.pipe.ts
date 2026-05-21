import { Pipe, PipeTransform } from '@angular/core';
import { isEqual } from 'lodash-es';
import { getOptionProp, OptionKey } from '../../utils/internal/option-utils';

@Pipe({ standalone: true, name: 'combineLabels' })
export class CombineLabelsPipe implements PipeTransform {
  transform(
    values: any[],
    options: any[],
    valueKey: OptionKey,
    labelKey: OptionKey,
    returnObject: boolean
  ): string {
    return values
      .map((v) => {
        if (returnObject) {
          return getOptionProp(v, labelKey);
        } else {
          const option = options.find((opt) =>
            isEqual(getOptionProp(opt, valueKey), v)
          );
          return option ? getOptionProp(option, labelKey) : '';
        }
      })
      .join(', ');
  }
}
