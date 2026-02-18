import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TaskService, Label, Task } from '../../services/task.service';

@Component({
  selector: 'app-labels',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="labels-view">
      <div class="labels-header">
        <h1>Labels</h1>
        <button class="btn btn-primary btn-sm" (click)="showCreateLabel = true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v8M8 12h8"/>
          </svg>
          New Label
        </button>
      </div>

      <div class="labels-content">
        <div class="labels-grid">
          <div class="label-card" *ngFor="let label of labels" 
               [style.--label-color]="label.color"
               (click)="selectLabel(label)">
            <div class="label-color-dot"></div>
            <div class="label-info">
              <h3>{{ label.name }}</h3>
              <span class="task-count">{{ label.taskCount }} tasks</span>
            </div>
            <div class="label-actions">
              <button class="icon-btn" (click)="editLabel(label, $event)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="icon-btn" (click)="deleteLabel(label, $event)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="empty-state" *ngIf="labels.length === 0">
            <p>No labels yet. Create one to organize your tasks.</p>
          </div>
        </div>

        <div class="label-tasks" *ngIf="selectedLabel">
          <div class="section-header">
            <h2>{{ selectedLabel.name }}</h2>
            <button class="btn btn-ghost btn-sm" (click)="selectedLabel = null">Close</button>
          </div>

          <div class="tasks-list">
            <div class="task-item" *ngFor="let task of labelTasks" [class.completed]="task.isCompleted">
              <div class="task-checkbox">
                <input type="checkbox" [checked]="task.isCompleted" (change)="toggleTask(task)">
              </div>
              <div class="task-content">
                <h4 [class.completed]="task.isCompleted">{{ task.title }}</h4>
                <span *ngIf="task.projectName" class="task-project">{{ task.projectName }}</span>
              </div>
            </div>

            <div class="empty-state" *ngIf="labelTasks.length === 0">
              <p>No tasks with this label.</p>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-overlay" *ngIf="showCreateLabel || editingLabel" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editingLabel ? 'Edit Label' : 'Create Label' }}</h3>
            <button class="icon-btn" (click)="closeModal()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label>Name</label>
              <input type="text" [(ngModel)]="labelForm.name" placeholder="Label name">
            </div>

            <div class="form-group">
              <label>Color</label>
              <div class="color-picker">
                <button
                  *ngFor="let color of colorOptions"
                  class="color-option"
                  [class.selected]="labelForm.color === color"
                  [style.background]="color"
                  (click)="labelForm.color = color">
                </button>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
            <button class="btn btn-primary" (click)="saveLabel()" [disabled]="!labelForm.name">
              {{ editingLabel ? 'Save Changes' : 'Create Label' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .labels-view {
      height: 100%;
      padding: 24px;
      overflow-y: auto;
    }

    .labels-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 32px;
    }

    .labels-header h1 {
      font-size: 28px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .labels-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    .label-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: var(--bg-card);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border-light);
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .label-card:hover {
      border-color: var(--color-primary-light);
      box-shadow: var(--shadow-sm);
    }

    .label-card:hover .label-actions {
      opacity: 1;
    }

    .label-color-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--label-color, var(--color-primary));
    }

    .label-info {
      flex: 1;
    }

    .label-info h3 {
      font-size: var(--font-size-md);
      font-weight: 500;
      color: var(--color-text-primary);
      margin-bottom: 2px;
    }

    .task-count {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }

    .label-actions {
      display: flex;
      gap: 4px;
      opacity: 0;
      transition: opacity var(--transition-fast);
    }

    .icon-btn {
      padding: 6px;
      border-radius: var(--radius-sm);
      color: var(--color-text-muted);
    }

    .icon-btn:hover {
      background: var(--bg-secondary);
      color: var(--color-text-primary);
    }

    .label-tasks {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid var(--color-border-light);
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .section-header h2 {
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--color-text-primary);
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

    .task-project {
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
    }

    .modal-overlay {
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
      width: 100%;
      max-width: 420px;
      box-shadow: var(--shadow-lg);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid var(--color-border-light);
    }

    .modal-header h3 {
      font-size: var(--font-size-lg);
      font-weight: 600;
    }

    .modal-body {
      padding: 24px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group:last-child {
      margin-bottom: 0;
    }

    .form-group label {
      display: block;
      font-size: var(--font-size-sm);
      font-weight: 500;
      color: var(--color-text-secondary);
      margin-bottom: 8px;
    }

    .form-group input {
      width: 100%;
    }

    .color-picker {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .color-option {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .color-option:hover {
      transform: scale(1.1);
    }

    .color-option.selected {
      border-color: var(--color-text-primary);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid var(--color-border-light);
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: var(--color-text-muted);
    }
  `]
})
export class LabelsComponent implements OnInit {
  private taskService = inject(TaskService);
  private destroyRef = inject(DestroyRef);

  labels: Label[] = [];
  selectedLabel: Label | null = null;
  labelTasks: Task[] = [];

  showCreateLabel = false;
  editingLabel: Label | null = null;

  labelForm = {
    name: '',
    color: '#A18267'
  };

  colorOptions = [
    '#A18267', '#B85450', '#6B8E6B', '#5A7A8A',
    '#C4A35A', '#7B6B8D', '#8B7259', '#5A8A7A'
  ];

  ngOnInit(): void {
    this.loadLabels();
  }

  loadLabels(): void {
    this.taskService.getLabels()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (labels) => {
          this.labels = labels;
        }
      });
  }

  selectLabel(label: Label): void {
    this.selectedLabel = label;
    this.loadLabelTasks(label.id);
  }

  loadLabelTasks(labelId: number): void {
    this.taskService.getTasksByLabel(labelId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tasks) => {
          this.labelTasks = tasks;
        }
      });
  }

  editLabel(label: Label, event: Event): void {
    event.stopPropagation();
    this.editingLabel = label;
    this.labelForm = {
      name: label.name,
      color: label.color
    };
  }

  deleteLabel(label: Label, event: Event): void {
    event.stopPropagation();
    if (confirm(`Delete label "${label.name}"?`)) {
      this.taskService.deleteLabel(label.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.loadLabels();
          }
        });
    }
  }

  saveLabel(): void {
    if (this.editingLabel) {
      this.taskService.updateLabel(this.editingLabel.id, this.labelForm)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.closeModal();
            this.loadLabels();
          }
        });
    } else {
      this.taskService.createLabel(this.labelForm)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.closeModal();
            this.loadLabels();
          }
        });
    }
  }

  closeModal(): void {
    this.showCreateLabel = false;
    this.editingLabel = null;
    this.labelForm = { name: '', color: '#A18267' };
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
