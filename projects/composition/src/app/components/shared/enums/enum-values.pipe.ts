import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'enumValues',
  standalone: true
})
export class EnumValuesPipe implements PipeTransform {
  transform(
    values: { name: string; value: string | number }[]
  ): { name: string; value: string | number }[] {
    // Wraps value in "" in case it is a string
    return values.map((value) => ({
      ...value,
      value: typeof value.value === 'string' ? `"${value.value}"` : value.value
    }));
  }
}
