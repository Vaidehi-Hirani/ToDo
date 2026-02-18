import { Injectable } from '@angular/core';
import { RecurringType, RepeatCustom, Task } from './task.service';

@Injectable({
  providedIn: 'root'
})
export class RecurringTaskService {

  getNextDueDate(currentDueDate: string, repeatType: RecurringType, repeatCustom?: RepeatCustom): string | null {
    const date = new Date(currentDueDate);
    
    switch (repeatType) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'biweekly':
        date.setDate(date.getDate() + 14);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      case 'custom':
        if (repeatCustom) {
          this.calculateCustomDate(date, repeatCustom);
        } else {
          return null;
        }
        break;
      case 'none':
      default:
        return null;
    }

    return this.formatDate(date);
  }

  private calculateCustomDate(date: Date, custom: RepeatCustom): void {
    switch (custom.interval) {
      case 'day':
        date.setDate(date.getDate() + custom.frequency);
        break;
      case 'week':
        if (custom.daysOfWeek && custom.daysOfWeek.length > 0) {
          this.moveToNextDayOfWeek(date, custom.daysOfWeek, custom.frequency);
        } else {
          date.setDate(date.getDate() + (custom.frequency * 7));
        }
        break;
      case 'month':
        date.setMonth(date.getMonth() + custom.frequency);
        if (custom.dayOfMonth) {
          date.setDate(Math.min(custom.dayOfMonth, this.getDaysInMonth(date)));
        }
        break;
      case 'year':
        date.setFullYear(date.getFullYear() + custom.frequency);
        if (custom.monthOfYear) {
          date.setMonth(custom.monthOfYear - 1);
          if (custom.dayOfMonth) {
            date.setDate(Math.min(custom.dayOfMonth, this.getDaysInMonth(date)));
          }
        }
        break;
    }
  }

  private moveToNextDayOfWeek(date: Date, daysOfWeek: number[], frequency: number): void {
    const currentDay = date.getDay();
    let nextDayIndex = -1;
    
    for (const day of daysOfWeek) {
      if (day > currentDay) {
        if (nextDayIndex === -1 || day < daysOfWeek[nextDayIndex]) {
          nextDayIndex = daysOfWeek.indexOf(day);
        }
      }
    }

    if (nextDayIndex !== -1) {
      date.setDate(date.getDate() + (daysOfWeek[nextDayIndex] - currentDay));
    } else {
      date.setDate(date.getDate() + (7 - currentDay) + daysOfWeek[0]);
      date.setDate(date.getDate() + (frequency - 1) * 7);
    }
  }

  private getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  generateRecurrencePreview(startDate: string, repeatType: RecurringType, repeatCustom?: RepeatCustom, count: number = 5): string[] {
    const dates: string[] = [];
    let currentDate = new Date(startDate);

    for (let i = 0; i < count; i++) {
      const nextDate = this.getNextDueDate(
        this.formatDate(currentDate),
        i === 0 ? repeatType : repeatType,
        repeatCustom
      );

      if (!nextDate) break;
      
      dates.push(nextDate);
      currentDate = new Date(nextDate);
    }

    return dates;
  }

  isRecurringTask(task: Task): boolean {
    return task.repeatType !== undefined && task.repeatType !== 'none';
  }

  getRepeatTypeLabel(repeatType: RecurringType): string {
    const labels: Record<RecurringType, string> = {
      none: 'Does not repeat',
      daily: 'Every day',
      weekly: 'Every week',
      biweekly: 'Every 2 weeks',
      monthly: 'Every month',
      quarterly: 'Every 3 months',
      yearly: 'Every year',
      custom: 'Custom...'
    };
    return labels[repeatType] || 'Does not repeat';
  }

  getRepeatSummary(task: Task): string {
    if (!task.repeatType || task.repeatType === 'none') {
      return 'Does not repeat';
    }

    if (task.repeatType === 'custom' && task.repeatCustom) {
      return this.getCustomRepeatSummary(task.repeatCustom);
    }

    return this.getRepeatTypeLabel(task.repeatType);
  }

  private getCustomRepeatSummary(custom: RepeatCustom): string {
    const frequency = custom.frequency;
    let summary = '';

    switch (custom.interval) {
      case 'day':
        summary = frequency === 1 ? 'Every day' : `Every ${frequency} days`;
        break;
      case 'week':
        if (custom.daysOfWeek && custom.daysOfWeek.length > 0) {
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const days = custom.daysOfWeek.map(d => dayNames[d]).join(', ');
          summary = frequency === 1 ? `Every week on ${days}` : `Every ${frequency} weeks on ${days}`;
        } else {
          summary = frequency === 1 ? 'Every week' : `Every ${frequency} weeks`;
        }
        break;
      case 'month':
        if (custom.dayOfMonth) {
          summary = frequency === 1 ? `Every month on day ${custom.dayOfMonth}` : `Every ${frequency} months on day ${custom.dayOfMonth}`;
        } else {
          summary = frequency === 1 ? 'Every month' : `Every ${frequency} months`;
        }
        break;
      case 'year':
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        if (custom.monthOfYear && custom.dayOfMonth) {
          summary = `Every year on ${monthNames[custom.monthOfYear - 1]} ${custom.dayOfMonth}`;
        } else {
          summary = 'Every year';
        }
        break;
    }

    if (custom.endDate) {
      const endDate = new Date(custom.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      summary += ` until ${endDate}`;
    }

    return summary;
  }

  shouldAutoCreateNext(task: Task): boolean {
    return this.isRecurringTask(task);
  }

  calculateNextOccurrenceDate(task: Task): string | null {
    if (!task.dueDate || !this.isRecurringTask(task)) {
      return null;
    }
    return this.getNextDueDate(task.dueDate, task.repeatType!, task.repeatCustom);
  }
}
