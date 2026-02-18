import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TaskService, Task } from '../../services/task.service';

@Component({
  selector: 'app-upcoming',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="upcoming-view">
      <div class="upcoming-header">
        <h1>Upcoming</h1>
      </div>

      <div class="upcoming-content">
        <div class="date-group" *ngFor="let group of upcomingTasks">
          <div class="date-header">
            <h2>{{ group.date | date:'EEEE, MMMM d' }}</h2>
            <span class="task-count">{{ group.tasks.length }} tasks</span>
          </div>

          <div class="tasks-list">
            <div class="task-item" *ngFor="let task of group.tasks" [class.completed]="task.isCompleted">
              <div class="task-checkbox">
                <input
                  type="checkbox"
                  [checked]="task.isCompleted"
                  (change)="toggleTask(task)">
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
          </div>
        </div>

        <div class="empty-state" *ngIf="upcomingTasks.length === 0">
          <p>No upcoming tasks. You're all caught up!</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .upcoming-view {
      height: 100%;
      padding: 24px;
      overflow-y: auto;
    }

    .upcoming-header {
      margin-bottom: 32px;
    }

    .upcoming-header h1 {
      font-size: 28px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .date-group {
      margin-bottom: 32px;
    }

    .date-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--color-border-light);
    }

    .date-header h2 {
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .task-count {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }

    .tasks-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .task-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      background: var(--bg-card);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border-light);
      transition: all var(--transition-fast);
    }

    .task-item:hover {
      border-color: var(--color-primary-light);
      box-shadow: var(--shadow-sm);
    }

    .task-item.completed {
      opacity: 0.6;
    }

    .task-checkbox input {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: var(--color-primary);
    }

    .task-content {
      flex: 1;
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
      gap: 12px;
      font-size: var(--font-size-xs);
    }

    .task-project {
      color: var(--color-text-secondary);
    }

    .task-priority {
      padding: 2px 8px;
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
      padding: 48px 24px;
      color: var(--color-text-muted);
    }
  `]
})
export class UpcomingComponent implements OnInit {
  private taskService = inject(TaskService);
  private destroyRef = inject(DestroyRef);

  upcomingTasks: { date: Date; tasks: Task[] }[] = [];

  ngOnInit(): void {
    this.loadUpcomingTasks();
  }

  loadUpcomingTasks(): void {
    this.taskService.getUpcomingTasks(14)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tasks) => {
          this.groupTasksByDate(tasks);
        }
      });
  }

  groupTasksByDate(tasks: Task[]): void {
    const groups: { date: Date; tasks: Task[] }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    tasks.forEach(task => {
      if (!task.dueDate) return;
      
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      let group = groups.find(g => 
        g.date.getTime() === dueDate.getTime()
      );

      if (!group) {
        group = { date: dueDate, tasks: [] };
        groups.push(group);
      }

      group.tasks.push(task);
    });

    this.upcomingTasks = groups;
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
