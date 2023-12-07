import { Pipe, PipeTransform } from '@angular/core';

/**
 * The CpsPaginatePipe is a pipe designed to provide a set of items in batches, taking into account specified pagination parameters.
 * @group Pipes
 */
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
