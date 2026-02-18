import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { AuthService, AuthResponse } from '../../services/auth.service';
import { AdminService, UserDto } from '../../services/admin.service';
import { TaskService, Task, CreateTaskDto, RecurringType, RepeatCustom } from '../../services/task.service';
import { ProjectService, Project, CreateProjectDto } from '../../services/project.service';
import { RecurringTaskService } from '../../services/recurring-task.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="dashboard-layout">
      <aside class="sidebar">
        <div class="sidebar-header">
          <h1>ToDo</h1>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/today" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            <span>Today</span>
          </a>
          <a routerLink="/upcoming" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>Upcoming</span>
          </a>
          <a routerLink="/calendar" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
            </svg>
            <span>Calendar</span>
          </a>
          <a routerLink="/labels" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
              <line x1="7" y1="7" x2="7.01" y2="7"/>
            </svg>
            <span>Labels</span>
          </a>

          <div class="nav-divider"></div>

          <div class="nav-section-title">Projects</div>
          <div class="nav-projects">
            <a class="nav-item project-item" *ngFor="let project of projects" (click)="selectProject(project)">
              <span class="project-color" [style.background]="project.color || '#A18267'"></span>
              <span class="project-name">{{ project.name }}</span>
            </a>
          </div>

          <button class="nav-item add-project-btn" (click)="openProjectModal()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v8M8 12h8"/>
            </svg>
            <span>Add Project</span>
          </button>
        </nav>

        <div class="sidebar-footer">
          <div class="user-info" *ngIf="currentUser">
            <div class="user-avatar">{{ currentUser.name?.charAt(0) || 'U' }}</div>
            <div class="user-details">
              <span class="user-name">{{ currentUser.name }}</span>
              <span class="user-email">{{ currentUser.email }}</span>
            </div>
          </div>
          <button class="logout-btn" (click)="onLogout()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>

      <main class="main-content">
        <div class="content-header">
          <div class="header-left">
            <h1>{{ selectedProject ? selectedProject.name : 'All Tasks' }}</h1>
            <p class="header-subtitle">{{ tasks.length }} tasks</p>
          </div>
          <div class="header-actions">
            <button class="btn btn-primary" (click)="openTaskModal()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v8M8 12h8"/>
              </svg>
              Add Task
            </button>
          </div>
        </div>

        <div class="tasks-container">
          <div class="tasks-list" *ngIf="tasks.length > 0; else noTasks">
            <div class="task-item" *ngFor="let task of tasks" [class.completed]="task.isCompleted">
              <div class="task-checkbox">
                <input
                  type="checkbox"
                  [checked]="task.isCompleted"
                  (change)="toggleTask(task)">
              </div>
              <div class="task-content">
                <h4 [class.completed]="task.isCompleted">{{ task.title }}</h4>
                <p *ngIf="task.description" class="task-description">{{ task.description }}</p>
                <div class="task-meta">
                  <span *ngIf="task.dueDate" class="task-due">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                    </svg>
                    {{ task.dueDate | date:'MMM d' }}
                  </span>
                  <span *ngIf="task.priority" class="task-priority" [attr.data-priority]="task.priority">
                    {{ task.priority }}
                  </span>
                  <span *ngIf="task.repeatType && task.repeatType !== 'none'" class="task-repeat" title="{{ getRepeatLabel(task) }}">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17 1l4 4-4 4"/>
                      <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                      <path d="M7 23l-4-4 4-4"/>
                      <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                    </svg>
                  </span>
                </div>
              </div>
              <div class="task-actions">
                <button class="icon-btn" (click)="deleteTask(task.id)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <ng-template #noTasks>
            <div class="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="2"/>
                <line x1="9" y1="12" x2="15" y2="12"/>
                <line x1="9" y1="16" x2="15" y2="16"/>
              </svg>
              <p>No tasks yet</p>
              <button class="btn btn-primary" (click)="openTaskModal()">Create your first task</button>
            </div>
          </ng-template>
        </div>
      </main>

      <!-- Task Modal -->
      <div class="modal-overlay" *ngIf="showTaskModal" (click)="closeTaskModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Add Task</h3>
            <button class="icon-btn" (click)="closeTaskModal()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <input
                type="text"
                [(ngModel)]="newTask.title"
                placeholder="What needs to be done?"
                autofocus>
            </div>

            <div class="form-group">
              <textarea
                [(ngModel)]="newTask.description"
                placeholder="Add a description..."
                rows="3">
              </textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Due Date</label>
                <input type="date" [(ngModel)]="newTask.dueDate">
              </div>

              <div class="form-group">
                <label>Priority</label>
                <select [(ngModel)]="newTask.priority">
                  <option value="">None</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Project</label>
              <select [(ngModel)]="newTask.projectId">
                <option [ngValue]="undefined">No Project</option>
                <option *ngFor="let project of projects" [ngValue]="project.id">
                  {{ project.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeTaskModal()">Cancel</button>
            <button class="btn btn-primary" (click)="createTask()" [disabled]="!newTask.title.trim()">
              Add Task
            </button>
          </div>
        </div>
      </div>

      <!-- Project Modal -->
      <div class="modal-overlay" *ngIf="showProjectModal" (click)="closeProjectModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>New Project</h3>
            <button class="icon-btn" (click)="closeProjectModal()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <input
                type="text"
                [(ngModel)]="newProject.name"
                placeholder="Project name"
                autofocus>
            </div>

            <div class="form-group">
              <textarea
                [(ngModel)]="newProject.description"
                placeholder="Description (optional)"
                rows="3">
              </textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeProjectModal()">Cancel</button>
            <button class="btn btn-primary" (click)="createProject()" [disabled]="!newProject.name.trim()">
              Create Project
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-layout {
      display: flex;
      height: 100vh;
      background: var(--bg-primary);
    }

    .sidebar {
      width: 260px;
      background: var(--bg-surface);
      border-right: 1px solid var(--color-border-light);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }

    .sidebar-header {
      padding: 20px 24px;
      border-bottom: 1px solid var(--color-border-light);
    }

    .sidebar-header h1 {
      font-size: 22px;
      font-weight: 700;
      color: var(--color-text-primary);
      letter-spacing: -0.5px;
    }

    .sidebar-nav {
      flex: 1;
      padding: 16px 12px;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: var(--radius-md);
      color: var(--color-text-secondary);
      text-decoration: none;
      transition: all var(--transition-fast);
      margin-bottom: 4px;
    }

    .nav-item:hover {
      background: var(--bg-secondary);
      color: var(--color-text-primary);
    }

    .nav-item.active {
      background: var(--color-primary-light);
      color: var(--color-text-primary);
    }

    .nav-item svg {
      flex-shrink: 0;
    }

    .nav-divider {
      height: 1px;
      background: var(--color-border-light);
      margin: 16px 0;
    }

    .nav-section-title {
      font-size: var(--font-size-xs);
      font-weight: 600;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 8px 12px;
      margin-bottom: 4px;
    }

    .nav-projects {
      max-height: 200px;
      overflow-y: auto;
    }

    .project-item {
      padding: 8px 12px;
    }

    .project-color {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .project-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .add-project-btn {
      width: 100%;
      margin-top: 8px;
      color: var(--color-text-muted);
    }

    .add-project-btn:hover {
      color: var(--color-primary);
    }

    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid var(--color-border-light);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--color-primary);
      color: var(--color-text-light);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: var(--font-size-sm);
    }

    .user-details {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-size: var(--font-size-sm);
      font-weight: 500;
      color: var(--color-text-primary);
    }

    .user-email {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }

    .logout-btn {
      padding: 8px;
      border-radius: var(--radius-sm);
      color: var(--color-text-muted);
    }

    .logout-btn:hover {
      background: var(--bg-secondary);
      color: var(--color-text-primary);
    }

    .main-content {
      flex: 1;
      padding: 32px 48px;
      overflow-y: auto;
    }

    .content-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 32px;
    }

    .header-left h1 {
      font-size: 28px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin-bottom: 4px;
    }

    .header-subtitle {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }

    .tasks-container {
      max-width: 800px;
    }

    .tasks-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .task-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 16px 20px;
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
      width: 20px;
      height: 20px;
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

    .task-description {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      margin-bottom: 8px;
    }

    .task-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: var(--font-size-xs);
    }

    .task-due {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--color-text-muted);
    }

    .task-priority {
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: 500;
      text-transform: capitalize;
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

    .task-repeat {
      display: flex;
      align-items: center;
      color: var(--color-primary);
    }

    .task-actions {
      opacity: 0;
      transition: opacity var(--transition-fast);
    }

    .task-item:hover .task-actions {
      opacity: 1;
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

    .empty-state {
      text-align: center;
      padding: 64px 24px;
      color: var(--color-text-muted);
    }

    .empty-state svg {
      margin-bottom: 16px;
      color: var(--color-border);
    }

    .empty-state p {
      margin-bottom: 16px;
      font-size: var(--font-size-md);
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
      max-width: 480px;
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

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid var(--color-border-light);
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

    .form-group input,
    .form-group textarea,
    .form-group select {
      width: 100%;
    }

    .form-group textarea {
      resize: vertical;
      min-height: 80px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private adminService = inject(AdminService);
  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);
  private recurringService = inject(RecurringTaskService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  currentUser: AuthResponse | null = null;
  isAdmin = false;

  users: UserDto[] = [];
  loading = false;
  error = '';

  tasks: Task[] = [];
  projects: Project[] = [];
  selectedProject: Project | null = null;

  showTaskModal = false;
  showProjectModal = false;
  showRecurrencePicker = false;

  newTask: CreateTaskDto = { title: '' };
  newProject: CreateProjectDto = { name: '' };

  repeatType: RecurringType = 'none';
  repeatCustom?: RepeatCustom;

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.currentUser = this.authService.getCurrentUser();
    this.isAdmin = this.authService.isAdmin();

    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.currentUser = user;
        this.isAdmin = this.authService.isAdmin();
      });

    if (this.isAdmin) {
      this.loadUsers();
    }

    this.loadTasksAndProjects();
  }

  loadUsers(): void {
    this.loading = true;
    this.adminService.getAllUsers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (users) => {
          this.users = users;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  deleteUser(userId: number, userName: string): void {
    if (!confirm(`Are you sure you want to delete user "${userName}"?`)) {
      return;
    }

    this.loading = true;
    this.adminService.deleteUser(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadUsers();
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  toggleUserRole(user: UserDto): void {
    const newRole = user.role === 'Admin' ? 'User' : 'Admin';
    if (!confirm(`Are you sure you want to ${newRole === 'Admin' ? 'promote' : 'demote'} "${user.name}" to ${newRole}?`)) {
      return;
    }

    this.loading = true;
    this.adminService.updateUserRole(user.id, newRole)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadUsers();
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  loadTasksAndProjects(): void {
    this.loading = true;
    forkJoin({
      tasks: this.taskService.getTasks(),
      projects: this.projectService.getProjects()
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (result) => {
        this.tasks = result.tasks;
        this.projects = result.projects;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  selectProject(project: Project): void {
    this.selectedProject = project;
    this.loadProjectTasks(project.id);
  }

  loadProjectTasks(projectId: number): void {
    this.taskService.getTasks(projectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tasks) => {
          this.tasks = tasks;
        }
      });
  }

  openTaskModal(): void {
    this.newTask = { title: '' };
    this.showTaskModal = true;
  }

  closeTaskModal(): void {
    this.showTaskModal = false;
    this.showRecurrencePicker = false;
    this.newTask = { title: '' };
    this.repeatType = 'none';
    this.repeatCustom = undefined;
  }

  createTask(): void {
    if (!this.newTask.title.trim()) return;

    this.loading = true;
    const taskData: CreateTaskDto = {
      title: this.newTask.title,
      description: this.newTask.description,
      dueDate: this.newTask.dueDate,
      priority: this.newTask.priority,
      repeatType: this.repeatType,
      repeatCustom: this.repeatCustom,
      projectId: this.newTask.projectId ? Number(this.newTask.projectId) : undefined
    };

    this.taskService.createTask(taskData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.closeTaskModal();
          this.loadTasksAndProjects();
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  onRepeatTypeChange(type: RecurringType): void {
    this.repeatType = type;
    if (type !== 'custom') {
      this.repeatCustom = undefined;
    }
    this.newTask.repeatType = type;
    this.newTask.repeatCustom = this.repeatCustom;
  }

  onRepeatCustomChange(custom: RepeatCustom | undefined): void {
    this.repeatCustom = custom;
    this.newTask.repeatCustom = custom;
  }

  getRepeatLabel(task: Task): string {
    return this.recurringService.getRepeatSummary(task);
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

  deleteTask(taskId: number): void {
    if (!confirm('Are you sure you want to delete this task?')) return;

    this.taskService.deleteTask(taskId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadTasksAndProjects();
        }
      });
  }

  openProjectModal(): void {
    this.newProject = { name: '' };
    this.showProjectModal = true;
  }

  closeProjectModal(): void {
    this.showProjectModal = false;
    this.newProject = { name: '' };
  }

  createProject(): void {
    if (!this.newProject.name.trim()) return;

    this.loading = true;
    this.projectService.createProject(this.newProject)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.closeProjectModal();
          this.loadTasksAndProjects();
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  deleteProject(projectId: number): void {
    if (!confirm('Are you sure you want to delete this project?')) return;

    this.projectService.deleteProject(projectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadTasksAndProjects();
        }
      });
  }
}
