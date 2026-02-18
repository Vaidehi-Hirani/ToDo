import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecurringType, RepeatCustom } from '../../services/task.service';

interface RepeatOption {
  value: RecurringType;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-recurrence-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="recurrence-picker">
      <div class="picker-header">
        <h3>Repeat</h3>
        <button class="close-btn" (click)="onCancel()">×</button>
      </div>

      <div class="repeat-options">
        <button
          *ngFor="let option of repeatOptions"
          class="repeat-option"
          [class.selected]="repeatType === option.value"
          (click)="selectRepeatType(option.value)">
          <span class="option-icon">{{ option.icon }}</span>
          <span class="option-label">{{ option.label }}</span>
        </button>
      </div>

      <div class="custom-options" *ngIf="repeatType === 'custom'">
        <div class="form-group">
          <label>Repeat every</label>
          <div class="frequency-row">
            <input type="number" [(ngModel)]="custom.frequency" min="1" max="99" class="frequency-input">
            <select [(ngModel)]="custom.interval" class="interval-select">
              <option value="day">day(s)</option>
              <option value="week">week(s)</option>
              <option value="month">month(s)</option>
              <option value="year">year(s)</option>
            </select>
          </div>
        </div>

        <div class="form-group" *ngIf="custom.interval === 'week'">
          <label>Repeat on</label>
          <div class="days-selector">
            <button
              *ngFor="let day of weekDays; let i = index"
              class="day-btn"
              [class.selected]="custom.daysOfWeek?.includes(i)"
              (click)="toggleDayOfWeek(i)">
              {{ day }}
            </button>
          </div>
        </div>

        <div class="form-group" *ngIf="custom.interval === 'month' || custom.interval === 'year'">
          <label>Day of month</label>
          <input type="number" [(ngModel)]="custom.dayOfMonth" min="1" max="31" class="day-input">
        </div>

        <div class="form-group" *ngIf="custom.interval === 'year'">
          <label>Month</label>
          <select [(ngModel)]="custom.monthOfYear" class="month-select">
            <option *ngFor="let month of monthNames; let i = index" [value]="i + 1">{{ month }}</option>
          </select>
        </div>

        <div class="form-group">
          <label>Ends</label>
          <div class="end-options">
            <label class="radio-option">
              <input type="radio" name="endType" [(ngModel)]="endType" value="never">
              <span>Never</span>
            </label>
            <label class="radio-option">
              <input type="radio" name="endType" [(ngModel)]="endType" value="after">
              <span>After</span>
            </label>
            <label class="radio-option">
              <input type="radio" name="endType" [(ngModel)]="endType" value="onDate">
              <span>On date</span>
            </label>
          </div>

          <div class="end-detail" *ngIf="endType === 'after'">
            <input type="number" [(ngModel)]="custom.occurrences" min="1" max="999" class="occurrences-input">
            <span>occurrences</span>
          </div>

          <div class="end-detail" *ngIf="endType === 'onDate'">
            <input type="date" [(ngModel)]="endDate" class="end-date-input">
          </div>
        </div>
      </div>

      <div class="preview-section" *ngIf="previewDates.length > 0">
        <label>Upcoming dates</label>
        <div class="preview-dates">
          <span *ngFor="let date of previewDates" class="preview-date">{{ date | date:'MMM d' }}</span>
        </div>
      </div>

      <div class="picker-footer">
        <button class="btn btn-secondary" (click)="onCancel()">Cancel</button>
        <button class="btn btn-primary" (click)="onApply()">Apply</button>
      </div>
    </div>
  `,
  styles: [`
    .recurrence-picker {
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      width: 320px;
      max-height: 500px;
      overflow-y: auto;
    }

    .picker-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--color-border-light);
    }

    .picker-header h3 {
      font-size: var(--font-size-md);
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .close-btn {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      font-size: 18px;
      color: var(--color-text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      background: var(--bg-surface);
    }

    .repeat-options {
      padding: 8px;
    }

    .repeat-option {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 12px 16px;
      border-radius: var(--radius-md);
      text-align: left;
      color: var(--color-text-primary);
      transition: all var(--transition-fast);
    }

    .repeat-option:hover {
      background: var(--bg-surface);
    }

    .repeat-option.selected {
      background: var(--color-primary-light);
    }

    .option-icon {
      font-size: 18px;
    }

    .option-label {
      font-size: var(--font-size-sm);
    }

    .custom-options {
      padding: 16px 20px;
      border-top: 1px solid var(--color-border-light);
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group:last-child {
      margin-bottom: 0;
    }

    .form-group label {
      display: block;
      font-size: var(--font-size-xs);
      font-weight: 500;
      color: var(--color-text-muted);
      margin-bottom: 8px;
    }

    .frequency-row {
      display: flex;
      gap: 8px;
    }

    .frequency-input {
      width: 60px;
      text-align: center;
    }

    .interval-select {
      flex: 1;
    }

    .days-selector {
      display: flex;
      gap: 4px;
    }

    .day-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      font-size: var(--font-size-xs);
      font-weight: 500;
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border);
      transition: all var(--transition-fast);
    }

    .day-btn:hover {
      border-color: var(--color-primary);
    }

    .day-btn.selected {
      background: var(--color-primary);
      border-color: var(--color-primary);
      color: var(--color-text-light);
    }

    .day-input, .month-select {
      width: 100%;
    }

    .end-options {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 12px;
    }

    .radio-option {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: var(--font-size-sm);
      color: var(--color-text-primary);
      cursor: pointer;
    }

    .radio-option input {
      accent-color: var(--color-primary);
    }

    .end-detail {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .occurrences-input {
      width: 60px;
    }

    .preview-section {
      padding: 12px 20px;
      border-top: 1px solid var(--color-border-light);
    }

    .preview-section label {
      display: block;
      font-size: var(--font-size-xs);
      font-weight: 500;
      color: var(--color-text-muted);
      margin-bottom: 8px;
    }

    .preview-dates {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .preview-date {
      font-size: var(--font-size-xs);
      padding: 4px 8px;
      background: var(--bg-surface);
      border-radius: var(--radius-sm);
      color: var(--color-text-secondary);
    }

    .picker-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 20px;
      border-top: 1px solid var(--color-border-light);
    }
  `]
})
export class RecurrencePickerComponent {
  @Input() repeatType: RecurringType = 'none';
  @Input() repeatCustom?: RepeatCustom;
  @Input() dueDate?: string;
  @Output() repeatTypeChange = new EventEmitter<RecurringType>();
  @Output() repeatCustomChange = new EventEmitter<RepeatCustom | undefined>();
  @Output() apply = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
               'July', 'August', 'September', 'October', 'November', 'December'];

  repeatOptions: RepeatOption[] = [
    { value: 'none', label: 'Does not repeat', icon: '○' },
    { value: 'daily', label: 'Every day', icon: '⟲' },
    { value: 'weekly', label: 'Every week', icon: '⟲' },
    { value: 'biweekly', label: 'Every 2 weeks', icon: '⟲' },
    { value: 'monthly', label: 'Every month', icon: '⟲' },
    { value: 'quarterly', label: 'Every 3 months', icon: '⟲' },
    { value: 'yearly', label: 'Every year', icon: '⟲' },
    { value: 'custom', label: 'Custom...', icon: '⚙' }
  ];

  custom: RepeatCustom = {
    frequency: 1,
    interval: 'week',
    daysOfWeek: [],
    dayOfMonth: 1,
    monthOfYear: 1
  };

  endType: 'never' | 'after' | 'onDate' = 'never';
  endDate: string = '';
  previewDates: string[] = [];

  ngOnInit(): void {
    if (this.repeatCustom) {
      this.custom = { ...this.repeatCustom };
    }
    if (this.endType === 'onDate' && this.repeatCustom?.endDate) {
      this.endDate = this.repeatCustom.endDate;
    }
  }

  selectRepeatType(type: RecurringType): void {
    this.repeatType = type;
    if (type !== 'custom') {
      this.repeatTypeChange.emit(type);
      this.repeatCustomChange.emit(undefined);
    }
  }

  toggleDayOfWeek(day: number): void {
    if (!this.custom.daysOfWeek) {
      this.custom.daysOfWeek = [];
    }

    const index = this.custom.daysOfWeek.indexOf(day);
    if (index > -1) {
      this.custom.daysOfWeek.splice(index, 1);
    } else {
      this.custom.daysOfWeek.push(day);
    }
  }

  onApply(): void {
    const custom: RepeatCustom = { ...this.custom };

    if (this.endType === 'after') {
      custom.occurrences = this.custom.occurrences;
    } else if (this.endType === 'onDate') {
      custom.endDate = this.endDate;
    }

    this.repeatTypeChange.emit('custom');
    this.repeatCustomChange.emit(custom);
    this.apply.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
