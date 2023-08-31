import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: true,
  name: 'cpsPaginate'
})
export class CpsPaginatePipe implements PipeTransform {
  transform(items: any[], config: { first: number; rows: number }): any[] {
    if (!items) {
      return [];
    }
    if (items.length < 1) {
      return items;
    }

    const first = config.first || 0;
    const rows = config.rows || 5;
    const last = first + rows;

    return items.slice(first, last);
  }
}
