import { Component, Output, EventEmitter, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TaskService, Task, CreateTaskDto } from '../../services/task.service';

@Component({
  selector: 'app-quick-add',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="quick-add-overlay" *ngIf="isOpen" (click)="close()">
      <div class="quick-add-content" (click)="$event.stopPropagation()">
        <input
          type="text"
          [(ngModel)]="taskTitle"
          placeholder="Add a task..."
          (keydown.enter)="addTask()"
          (keydown.escape)="close()"
          autofocus>

        <div class="quick-add-options">
          <div class="option-row">
            <button class="option-btn" (click)="showDatePicker = !showDatePicker">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span>{{ dueDateDisplay || 'Today' }}</span>
            </button>

            <div class="date-picker-popup" *ngIf="showDatePicker">
              <button class="date-option" (click)="setDueDate('today')">Today</button>
              <button class="date-option" (click)="setDueDate('tomorrow')">Tomorrow</button>
              <button class="date-option" (click)="setDueDate('nextWeek')">Next Week</button>
              <input type="date" [(ngModel)]="dueDate" (change)="showDatePicker = false">
            </div>
          </div>

          <div class="option-row">
            <button class="option-btn" (click)="togglePriority()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                <line x1="4" y1="22" x2="4" y2="15"/>
              </svg>
              <span [class]="'priority-' + priority">{{ priority || 'Priority' }}</span>
            </button>
          </div>
        </div>

        <div class="quick-add-actions">
          <button class="btn btn-primary" (click)="addTask()" [disabled]="!taskTitle.trim()">
            Add Task
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .quick-add-overlay {
      position: fixed;
      inset: 0;
      background: rgba(45, 36, 27, 0.4);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 100px;
      z-index: 1000;
    }

    .quick-add-content {
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 500px;
      box-shadow: var(--shadow-lg);
      overflow: hidden;
    }

    .quick-add-content input {
      width: 100%;
      padding: 16px 20px;
      font-size: var(--font-size-lg);
      border: none;
      border-bottom: 1px solid var(--color-border-light);
      background: transparent;
    }

    .quick-add-content input:focus {
      box-shadow: none;
    }

    .quick-add-options {
      display: flex;
      gap: 8px;
      padding: 12px 20px;
      border-bottom: 1px solid var(--color-border-light);
    }

    .option-row {
      position: relative;
    }

    .option-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }

    .option-btn:hover {
      background: var(--bg-surface);
    }

    .priority-High {
      color: var(--color-error);
    }

    .priority-Medium {
      color: var(--color-warning);
    }

    .priority-Low {
      color: var(--color-success);
    }

    .date-picker-popup {
      position: absolute;
      top: 100%;
      left: 0;
      margin-top: 4px;
      background: var(--bg-card);
      border: 1px solid var(--color-border-light);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-md);
      z-index: 10;
      min-width: 150px;
    }

    .date-option {
      display: block;
      width: 100%;
      padding: 10px 16px;
      text-align: left;
      font-size: var(--font-size-sm);
      color: var(--color-text-primary);
    }

    .date-option:hover {
      background: var(--bg-surface);
    }

    .date-picker-popup input {
      padding: 8px 16px;
      margin: 4px;
      width: calc(100% - 8px);
    }

    .quick-add-actions {
      display: flex;
      justify-content: flex-end;
      padding: 12px 20px;
    }
  `]
})
export class QuickAddComponent {
  @Output() taskAdded = new EventEmitter<Task>();

  private taskService = inject(TaskService);
  private destroyRef = inject(DestroyRef);

  isOpen = false;
  taskTitle = '';
  dueDate = '';
  priority = '';
  showDatePicker = false;

  get dueDateDisplay(): string {
    if (!this.dueDate) return '';
    const date = new Date(this.dueDate);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  open(): void {
    this.isOpen = true;
    this.reset();
  }

  close(): void {
    this.isOpen = false;
  }

  reset(): void {
    this.taskTitle = '';
    this.dueDate = '';
    this.priority = '';
  }

  setDueDate(option: string): void {
    const date = new Date();
    switch (option) {
      case 'today':
        break;
      case 'tomorrow':
        date.setDate(date.getDate() + 1);
        break;
      case 'nextWeek':
        date.setDate(date.getDate() + 7);
        break;
    }
    this.dueDate = date.toISOString().split('T')[0];
    this.showDatePicker = false;
  }

  togglePriority(): void {
    const levels = ['', 'High', 'Medium', 'Low'];
    const currentIndex = levels.indexOf(this.priority);
    this.priority = levels[(currentIndex + 1) % levels.length];
  }

  addTask(): void {
    if (!this.taskTitle.trim()) return;

    const task: CreateTaskDto = {
      title: this.taskTitle,
      dueDate: this.dueDate || new Date().toISOString().split('T')[0],
      priority: this.priority || undefined
    };

    this.taskService.createTask(task)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (createdTask) => {
          this.taskAdded.emit(createdTask);
          this.close();
        }
      });
  }
}
