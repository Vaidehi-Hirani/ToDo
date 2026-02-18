import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet, Router, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { AuthService, AuthResponse } from './services/auth.service';
import { ProjectService, Project } from './services/project.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  template: `
    <div class="app-layout" *ngIf="!isAuthPage(); else authPage">
      <aside class="sidebar">
        <div class="sidebar-header">
          <h1 (click)="router.navigate(['/today'])">ToDo</h1>
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
          <a routerLink="/filters" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            <span>Filters</span>
          </a>

          <div class="nav-divider"></div>

          <div class="nav-section-title">Projects</div>
          <div class="nav-projects">
            <a class="nav-item project-item" *ngFor="let project of projects()" (click)="selectProject(project)">
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

          <div class="nav-divider"></div>

          <a routerLink="/statistics" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            <span>Statistics</span>
          </a>
          <a routerLink="/settings" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            <span>Settings</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="user-info" *ngIf="currentUser()">
            <div class="user-avatar">{{ currentUser()?.name?.charAt(0) || 'U' }}</div>
            <div class="user-details">
              <span class="user-name">{{ currentUser()?.name }}</span>
              <span class="user-email">{{ currentUser()?.email }}</span>
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
        <router-outlet />
      </main>
    </div>

    <ng-template #authPage>
      <router-outlet />
    </ng-template>
  `,
  styles: [`
    .app-layout {
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
      cursor: pointer;
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
      cursor: pointer;
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
      overflow-y: auto;
    }
  `]
})
export class App implements OnInit {
  private authService = inject(AuthService);
  private projectService = inject(ProjectService);
  public router = inject(Router);

  currentUser = signal<AuthResponse | null>(null);
  projects = signal<Project[]>([]);
  isAuthPage = signal(true);

  ngOnInit(): void {
    this.checkAuth();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects;
      this.isAuthPage.set(url.includes('/login') || url.includes('/register'));
      if (!this.isAuthPage()) {
        this.loadProjects();
      }
    });
  }

  checkAuth(): void {
    if (this.authService.isLoggedIn()) {
      this.currentUser.set(this.authService.getCurrentUser());
    }
  }

  loadProjects(): void {
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        this.projects.set(projects);
      }
    });
  }

  selectProject(project: Project): void {
  }

  openProjectModal(): void {
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
