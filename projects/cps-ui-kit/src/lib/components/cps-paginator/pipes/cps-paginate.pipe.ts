import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: true,
  name: 'cpsPaginate'
})
export class CpsPaginatePipe implements PipeTransform {
  transform(
    items: any[],
    config: { currentPage: number; itemsPerPage: number }
  ): any[] {
    if (!items || items.length < 1) {
      return [];
    }

    const currentPage = config.currentPage || 0;
    const itemsPerPage = config.itemsPerPage || 5;

    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return items.slice(startIndex, endIndex);
  }
}
