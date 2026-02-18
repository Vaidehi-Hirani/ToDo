import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TaskService, Task } from '../../services/task.service';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="calendar-view">
      <div class="calendar-header">
        <div class="header-left">
          <h1>Calendar</h1>
          <span class="current-month">{{ currentDate | date:'MMMM yyyy' }}</span>
        </div>
        <div class="header-actions">
          <button class="btn btn-ghost btn-sm" (click)="previousMonth()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <button class="btn btn-secondary btn-sm" (click)="goToToday()">Today</button>
          <button class="btn btn-ghost btn-sm" (click)="nextMonth()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="calendar-grid">
        <div class="weekday-header" *ngFor="let day of weekdays">
          {{ day }}
        </div>

        <div class="calendar-day"
             *ngFor="let day of calendarDays"
             [class.other-month]="!day.isCurrentMonth"
             [class.today]="day.isToday"
             [class.has-tasks]="day.tasks.length > 0"
             (click)="selectDate(day)">
          <span class="day-number">{{ day.date | date:'d' }}</span>
          <div class="day-tasks">
            <div class="day-task-dot" *ngFor="let task of day.tasks.slice(0, 3)"></div>
            <span class="more-count" *ngIf="day.tasks.length > 3">+{{ day.tasks.length - 3 }}</span>
          </div>
        </div>
      </div>

      <div class="selected-date-panel" *ngIf="selectedDate">
        <div class="panel-header">
          <h3>{{ selectedDate | date:'EEEE, MMMM d' }}</h3>
          <button class="icon-btn" (click)="selectedDate = null">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="panel-tasks">
          <div class="task-item" *ngFor="let task of selectedDateTasks" [class.completed]="task.isCompleted">
            <div class="task-checkbox">
              <input type="checkbox" [checked]="task.isCompleted" (change)="toggleTask(task)">
            </div>
            <div class="task-content">
              <h4 [class.completed]="task.isCompleted">{{ task.title }}</h4>
              <div class="task-meta">
                <span *ngIf="task.projectName" class="task-project">{{ task.projectName }}</span>
                <span *ngIf="task.priority" class="task-priority" [attr.data-priority]="task.priority">
                  {{ task.priority }}
                </span>
              </div>
            </div>
          </div>

          <div class="empty-state" *ngIf="selectedDateTasks.length === 0">
            <p>No tasks for this day.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .calendar-view {
      height: 100%;
      padding: 24px;
      overflow-y: auto;
    }

    .calendar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .header-left {
      display: flex;
      align-items: baseline;
      gap: 12px;
    }

    .header-left h1 {
      font-size: 28px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .current-month {
      font-size: var(--font-size-lg);
      color: var(--color-text-muted);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 1px;
      background: var(--color-border-light);
      border: 1px solid var(--color-border-light);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .weekday-header {
      padding: 12px;
      text-align: center;
      font-size: var(--font-size-xs);
      font-weight: 600;
      color: var(--color-text-muted);
      background: var(--bg-surface);
      text-transform: uppercase;
    }

    .calendar-day {
      min-height: 100px;
      padding: 8px;
      background: var(--bg-card);
      cursor: pointer;
      transition: background var(--transition-fast);
    }

    .calendar-day:hover {
      background: var(--bg-secondary);
    }

    .calendar-day.other-month {
      background: var(--bg-surface);
    }

    .calendar-day.other-month .day-number {
      color: var(--color-text-muted);
    }

    .calendar-day.today {
      background: rgba(161, 130, 103, 0.1);
    }

    .calendar-day.today .day-number {
      background: var(--color-primary);
      color: var(--color-text-light);
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .day-number {
      font-size: var(--font-size-sm);
      font-weight: 500;
      color: var(--color-text-primary);
      margin-bottom: 4px;
    }

    .day-tasks {
      display: flex;
      flex-wrap: wrap;
      gap: 3px;
    }

    .day-task-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--color-primary);
    }

    .more-count {
      font-size: 10px;
      color: var(--color-text-muted);
    }

    .selected-date-panel {
      margin-top: 24px;
      padding: 20px;
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border-light);
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .panel-header h3 {
      font-size: var(--font-size-lg);
      font-weight: 600;
    }

    .icon-btn {
      padding: 4px;
      border-radius: var(--radius-sm);
      color: var(--color-text-muted);
    }

    .icon-btn:hover {
      background: var(--bg-secondary);
      color: var(--color-text-primary);
    }

    .panel-tasks {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .task-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      background: var(--bg-surface);
      border-radius: var(--radius-md);
    }

    .task-checkbox input {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: var(--color-primary);
    }

    .task-content h4 {
      font-size: var(--font-size-md);
      font-weight: 500;
      color: var(--color-text-primary);
      margin-bottom: 4px;
    }

    .task-content h4.completed {
      text-decoration: line-through;
      color: var(--color-text-muted);
    }

    .task-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: var(--font-size-xs);
    }

    .task-project {
      color: var(--color-text-secondary);
    }

    .task-priority {
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 500;
    }

    .task-priority[data-priority="High"] {
      background: rgba(184, 84, 80, 0.15);
      color: var(--color-error);
    }

    .task-priority[data-priority="Medium"] {
      background: rgba(196, 163, 90, 0.15);
      color: var(--color-warning);
    }

    .task-priority[data-priority="Low"] {
      background: rgba(107, 142, 107, 0.15);
      color: var(--color-success);
    }

    .empty-state {
      text-align: center;
      padding: 24px;
      color: var(--color-text-muted);
    }
  `]
})
export class CalendarComponent implements OnInit {
  private taskService = inject(TaskService);
  private destroyRef = inject(DestroyRef);

  currentDate = new Date();
  selectedDate: Date | null = null;
  selectedDateTasks: Task[] = [];
  calendarDays: { date: Date; isCurrentMonth: boolean; isToday: boolean; tasks: Task[] }[] = [];
  weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  ngOnInit(): void {
    this.generateCalendar();
  }

  generateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: { date: Date; isCurrentMonth: boolean; isToday: boolean; tasks: Task[] }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < firstDay.getDay(); i++) {
      const date = new Date(year, month, -firstDay.getDay() + i + 1);
      days.push({ date, isCurrentMonth: false, isToday: false, tasks: [] });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      date.setHours(0, 0, 0, 0);
      days.push({ date, isCurrentMonth: true, isToday: date.getTime() === today.getTime(), tasks: [] });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false, isToday: false, tasks: [] });
    }

    this.calendarDays = days;
    this.loadTasksForMonth(year, month);
  }

  loadTasksForMonth(year: number, month: number): void {
    const startDate = new Date(year, month, 1).toISOString();
    const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

    this.taskService.getTasks()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tasks) => {
          const monthTasks = tasks.filter(task => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            return dueDate >= new Date(year, month, 1) && dueDate <= new Date(year, month + 1, 0);
          });

          this.calendarDays.forEach(day => {
            day.tasks = monthTasks.filter(task => {
              if (!task.dueDate) return false;
              const dueDate = new Date(task.dueDate);
              return dueDate.toDateString() === day.date.toDateString();
            });
          });
        }
      });
  }

  selectDate(day: { date: Date; tasks: Task[] }): void {
    this.selectedDate = day.date;
    this.selectedDateTasks = day.tasks;
  }

  previousMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.generateCalendar();
  }

  goToToday(): void {
    this.currentDate = new Date();
    this.generateCalendar();
  }

  toggleTask(task: Task): void {
    this.taskService.toggleTaskCompletion(task.id, !task.isCompleted)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          task.isCompleted = !task.isCompleted;
        }
      });
  }
}
