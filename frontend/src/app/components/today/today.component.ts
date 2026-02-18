import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { AuthService, AuthResponse } from '../../services/auth.service';
import { TaskService, Task, CreateTaskDto, Label } from '../../services/task.service';
import { ProjectService, Project } from '../../services/project.service';

@Component({
  selector: 'app-today',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="today-view">
      <div class="today-header">
        <h1>Today</h1>
        <span class="today-date">{{ today | date:'EEEE, MMMM d' }}</span>
      </div>

      <div class="today-content">
        <div class="tasks-section">
          <div class="section-header">
            <h2>Tasks</h2>
            <span class="task-count">{{ todayTasks.length }} tasks</span>
          </div>

          <div class="tasks-list" *ngIf="todayTasks.length > 0; else noTasks">
            <div class="task-item" *ngFor="let task of todayTasks" [class.completed]="task.isCompleted">
              <div class="task-checkbox">
                <input
                  type="checkbox"
                  [checked]="task.isCompleted"
                  (change)="toggleTask(task)">
              </div>
              <div class="task-content" (click)="openTaskDetail(task)">
                <h4 [class.completed]="task.isCompleted">{{ task.title }}</h4>
                <div class="task-meta">
                  <span *ngIf="task.projectName" class="task-project">{{ task.projectName }}</span>
                  <span *ngIf="task.priority" class="task-priority" [attr.data-priority]="task.priority">
                    {{ task.priority }}
                  </span>
                  <span *ngIf="task.labels && task.labels.length > 0" class="task-labels">
                    <span class="label-dot" *ngFor="let label of task.labels"></span>
                  </span>
                </div>
              </div>
              <div class="task-actions">
                <button class="icon-btn" (click)="openQuickAdd(task)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v8M8 12h8"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <ng-template #noTasks>
            <div class="empty-state">
              <p>No tasks for today. Enjoy your day!</p>
            </div>
          </ng-template>
        </div>

        <div class="overdue-section" *ngIf="overdueTasks.length > 0">
          <div class="section-header">
            <h2>Overdue</h2>
            <span class="task-count">{{ overdueTasks.length }} tasks</span>
          </div>

          <div class="tasks-list">
            <div class="task-item overdue" *ngFor="let task of overdueTasks" [class.completed]="task.isCompleted">
              <div class="task-checkbox">
                <input
                  type="checkbox"
                  [checked]="task.isCompleted"
                  (change)="toggleTask(task)">
              </div>
              <div class="task-content" (click)="openTaskDetail(task)">
                <h4 [class.completed]="task.isCompleted">{{ task.title }}</h4>
                <p class="overdue-badge">Due {{ task.dueDate | date:'MMM d' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button class="quick-add-btn" (click)="openQuickAdd()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v8M8 12h8"/>
        </svg>
      </button>

      <div class="quick-add-modal" *ngIf="showQuickAdd" (click)="closeQuickAdd()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <input
            type="text"
            [(ngModel)]="newTaskTitle"
            placeholder="Add a task..."
            (keyup.enter)="addTask()"
            autofocus>
          <div class="modal-actions" *ngIf="newTaskTitle">
            <button class="btn btn-primary" (click)="addTask()">Add Task</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .today-view {
      height: 100%;
      padding: 24px;
      overflow-y: auto;
    }

    .today-header {
      margin-bottom: 32px;
    }

    .today-header h1 {
      font-size: 28px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin-bottom: 4px;
    }

    .today-date {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--color-border-light);
    }

    .section-header h2 {
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

    .task-item.overdue {
      border-color: var(--color-error);
      background: rgba(184, 84, 80, 0.05);
    }

    .task-checkbox input {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: var(--color-primary);
    }

    .task-content {
      flex: 1;
      cursor: pointer;
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

    .overdue-badge {
      font-size: var(--font-size-xs);
      color: var(--color-error);
      margin-top: 4px;
    }

    .task-actions {
      opacity: 0;
      transition: opacity var(--transition-fast);
    }

    .task-item:hover .task-actions {
      opacity: 1;
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

    .quick-add-btn {
      position: fixed;
      bottom: 32px;
      right: 32px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--color-primary);
      color: var(--color-text-light);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-lg);
      transition: all var(--transition-fast);
    }

    .quick-add-btn:hover {
      background: var(--color-primary-hover);
      transform: scale(1.05);
    }

    .quick-add-modal {
      position: fixed;
      inset: 0;
      background: rgba(45, 36, 27, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      padding: 24px;
      width: 100%;
      max-width: 500px;
      box-shadow: var(--shadow-lg);
    }

    .modal-content input {
      width: 100%;
      font-size: var(--font-size-lg);
      padding: 16px;
      border: none;
      border-bottom: 1px solid var(--color-border-light);
      background: transparent;
    }

    .modal-content input:focus {
      box-shadow: none;
      border-color: var(--color-primary);
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: var(--color-text-muted);
    }

    .overdue-section {
      margin-top: 32px;
    }
  `]
})
export class TodayComponent implements OnInit {
  private authService = inject(AuthService);
  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  currentUser: AuthResponse | null = null;
  todayTasks: Task[] = [];
  overdueTasks: Task[] = [];
  today = new Date();

  showQuickAdd = false;
  newTaskTitle = '';

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadTodayTasks();
  }

  loadTodayTasks(): void {
    this.taskService.getTodayTasks()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tasks) => {
          this.todayTasks = tasks;
        },
        error: (err) => {
          console.error('Error loading today tasks:', err);
        }
      });

    this.taskService.getOverdueTasks()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tasks) => {
          this.overdueTasks = tasks;
        }
      });
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

  openTaskDetail(task: Task): void {
  }

  openQuickAdd(task?: Task): void {
    this.showQuickAdd = true;
    this.newTaskTitle = task?.title || '';
  }

  closeQuickAdd(): void {
    this.showQuickAdd = false;
    this.newTaskTitle = '';
  }

  addTask(): void {
    if (!this.newTaskTitle.trim()) return;

    const task: CreateTaskDto = {
      title: this.newTaskTitle,
      dueDate: new Date().toISOString()
    };

    this.taskService.createTask(task)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.closeQuickAdd();
          this.loadTodayTasks();
        }
      });
  }
}
