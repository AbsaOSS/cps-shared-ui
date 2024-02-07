import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CpsSelectComponent } from '../../cps-select/cps-select.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'cron-time-picker',
  imports: [CommonModule, FormsModule, CpsSelectComponent],
  templateUrl: './cron-time-picker.component.html',
  styleUrls: ['./cron-time-picker.component.scss'],
  standalone: true
})
export class CronTimePickerComponent implements OnInit {
  @Output() timeChange = new EventEmitter();
  @Input() disabled = false;
  @Input() time: any;
  @Input() use24HourTime = true;

  hours: { label: string; value: number }[] = [];
  minutes: { label: string; value: number }[] = [];
  hourTypes: { label: string; value: string }[] = [];

  public ngOnInit() {
    this.hours = (
      this.use24HourTime ? this._getRange(0, 23) : this._getRange(0, 12)
    ).map((h: any) => ({
      value: h,
      label: h.toString().padStart(2, '0')
    }));
    this.minutes = this._getRange(0, 59).map((m) => ({
      value: m,
      label: m.toString().padStart(2, '0')
    }));
    this.hourTypes = [
      { label: 'AM', value: 'AM' },
      { label: 'PM', value: 'PM' }
    ];
  }

  onValueChanged() {
    this.timeChange.emit(this.time);
  }

  private _getRange(startFrom: number, until: number) {
    return Array.from(
      { length: until + 1 - startFrom },
      (_, k) => k + startFrom
    );
  }
}
