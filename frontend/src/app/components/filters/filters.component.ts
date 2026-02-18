import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TaskService, Task, Label } from '../../services/task.service';
import { ProjectService, Project } from '../../services/project.service';
import { Router } from '@angular/router';

interface Filter {
  id: number;
  name: string;
  query: string;
  isDefault?: boolean;
  taskCount?: number;
}

@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="filters-view">
      <div class="filters-header">
        <h1>Filters</h1>
        <button class="btn btn-primary btn-sm" (click)="showCreateFilter = true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v8M8 12h8"/>
          </svg>
          New Filter
        </button>
      </div>

      <div class="filters-content">
        <div class="quick-filters">
          <h2>Quick Filters</h2>
          <div class="filter-list">
            <button class="filter-item" (click)="applyFilter('today')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
              <span>Today</span>
              <span class="filter-count">{{ todayCount }}</span>
            </button>
            <button class="filter-item" (click)="applyFilter('overdue')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>Overdue</span>
              <span class="filter-count">{{ overdueCount }}</span>
            </button>
            <button class="filter-item" (click)="applyFilter('completed')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span>Completed</span>
              <span class="filter-count">{{ completedCount }}</span>
            </button>
            <button class="filter-item" (click)="applyFilter('no-date')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>No Date</span>
              <span class="filter-count">{{ noDateCount }}</span>
            </button>
          </div>
        </div>

        <div class="custom-filters">
          <h2>Custom Filters</h2>
          <div class="filter-list">
            <button class="filter-item" *ngFor="let filter of filters" (click)="applyCustomFilter(filter)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
              <span>{{ filter.name }}</span>
              <span class="filter-count">{{ filter.taskCount || 0 }}</span>
            </button>

            <div class="empty-state" *ngIf="filters.length === 0">
              <p>No custom filters yet. Create one to save your searches.</p>
            </div>
          </div>
        </div>

        <div class="filter-builder">
          <h2>Build Filter</h2>
          <div class="builder-section">
            <label>Search</label>
            <input type="text" [(ngModel)]="builder.search" placeholder="Search in task title...">
          </div>

          <div class="builder-section">
            <label>Project</label>
            <select [(ngModel)]="builder.projectId">
              <option [ngValue]="undefined">Any Project</option>
              <option *ngFor="let project of projects" [ngValue]="project.id">
                {{ project.name }}
              </option>
            </select>
          </div>

          <div class="builder-section">
            <label>Priority</label>
            <select [(ngModel)]="builder.priority">
              <option value="">Any Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div class="builder-section">
            <label>Labels</label>
            <div class="label-checkboxes">
              <label class="checkbox-label" *ngFor="let label of labels">
                <input type="checkbox" 
                       [checked]="builder.labelIds.includes(label.id)"
                       (change)="toggleLabel(label.id)">
                <span class="label-dot" [style.background]="label.color"></span>
                {{ label.name }}
              </label>
            </div>
          </div>

          <div class="builder-section">
            <label>Due Date</label>
            <select [(ngModel)]="builder.dueDate">
              <option value="">Any</option>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="overdue">Overdue</option>
              <option value="nodate">No Date</option>
            </select>
          </div>

          <div class="builder-actions">
            <button class="btn btn-secondary" (click)="resetBuilder()">Reset</button>
            <button class="btn btn-primary" (click)="applyBuilder()">Apply Filter</button>
            <button class="btn btn-secondary" (click)="showCreateFilter = true" [disabled]="!builder.name">
              Save as Filter
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filters-view {
      height: 100%;
      padding: 24px;
      overflow-y: auto;
    }

    .filters-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 32px;
    }

    .filters-header h1 {
      font-size: 28px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .filters-content {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
    }

    .quick-filters, .custom-filters, .filter-builder {
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border-light);
      padding: 24px;
    }

    .quick-filters h2, .custom-filters h2, .filter-builder h2 {
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--color-text-primary);
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--color-border-light);
    }

    .filter-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .filter-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: var(--bg-surface);
      border-radius: var(--radius-md);
      color: var(--color-text-secondary);
      text-align: left;
      transition: all var(--transition-fast);
    }

    .filter-item:hover {
      background: var(--bg-secondary);
      color: var(--color-text-primary);
    }

    .filter-item svg {
      flex-shrink: 0;
    }

    .filter-item span:first-of-type {
      flex: 1;
    }

    .filter-count {
      font-size: var(--font-size-xs);
      font-weight: 500;
      padding: 2px 8px;
      background: var(--color-primary-light);
      border-radius: 10px;
      color: var(--color-text-secondary);
    }

    .builder-section {
      margin-bottom: 20px;
    }

    .builder-section label {
      display: block;
      font-size: var(--font-size-sm);
      font-weight: 500;
      color: var(--color-text-secondary);
      margin-bottom: 8px;
    }

    .builder-section input,
    .builder-section select {
      width: 100%;
    }

    .label-checkboxes {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: var(--font-size-sm);
      color: var(--color-text-primary);
      cursor: pointer;
    }

    .checkbox-label input {
      width: auto;
    }

    .label-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .builder-actions {
      display: flex;
      gap: 12px;
      padding-top: 16px;
      border-top: 1px solid var(--color-border-light);
    }

    .empty-state {
      text-align: center;
      padding: 24px;
      color: var(--color-text-muted);
    }
  `]
})
export class FiltersComponent implements OnInit {
  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  todayCount = 0;
  overdueCount = 0;
  completedCount = 0;
  noDateCount = 0;

  filters: Filter[] = [];
  labels: Label[] = [];
  projects: Project[] = [];

  showCreateFilter = false;

  builder = {
    name: '',
    search: '',
    projectId: undefined as number | undefined,
    priority: '',
    labelIds: [] as number[],
    dueDate: ''
  };

  ngOnInit(): void {
    this.loadFilters();
    this.loadLabels();
    this.loadProjects();
    this.loadTaskCounts();
  }

  loadFilters(): void {
    this.filters = [];
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

  loadProjects(): void {
    this.projectService.getProjects()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (projects) => {
          this.projects = projects;
        }
      });
  }

  loadTaskCounts(): void {
    this.taskService.getTodayTasks()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tasks) => {
          this.todayCount = tasks.length;
        }
      });

    this.taskService.getOverdueTasks()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tasks) => {
          this.overdueCount = tasks.length;
        }
      });
  }

  toggleLabel(labelId: number): void {
    const index = this.builder.labelIds.indexOf(labelId);
    if (index > -1) {
      this.builder.labelIds.splice(index, 1);
    } else {
      this.builder.labelIds.push(labelId);
    }
  }

  applyFilter(type: string): void {
  }

  applyCustomFilter(filter: Filter): void {
  }

  applyBuilder(): void {
  }

  resetBuilder(): void {
    this.builder = {
      name: '',
      search: '',
      projectId: undefined,
      priority: '',
      labelIds: [],
      dueDate: ''
    };
  }
}
