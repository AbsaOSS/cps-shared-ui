import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'objectEntries',
  pure: true,
  standalone: true
})
export class ObjectEntriesPipe implements PipeTransform {
  transform(value: any): any {
    return Object.entries(value);
  }
}
