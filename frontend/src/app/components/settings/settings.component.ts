import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService, AuthResponse } from '../../services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-view">
      <div class="settings-header">
        <h1>Settings</h1>
      </div>

      <div class="settings-content">
        <div class="settings-section">
          <h2>Profile</h2>
          <div class="profile-info">
            <div class="avatar-section">
              <div class="avatar">{{ currentUser?.name?.charAt(0) || 'U' }}</div>
              <button class="btn btn-secondary btn-sm">Change Avatar</button>
            </div>
            <div class="profile-form">
              <div class="form-group">
                <label>Name</label>
                <input type="text" [(ngModel)]="profile.name" placeholder="Your name">
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" [(ngModel)]="profile.email" placeholder="your@email.com" disabled>
              </div>
              <button class="btn btn-primary" (click)="saveProfile()">Save Changes</button>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h2>Notifications</h2>
          <div class="notification-options">
            <div class="toggle-option">
              <div class="toggle-info">
                <h4>Email Notifications</h4>
                <p>Receive email updates about your tasks</p>
              </div>
              <label class="toggle">
                <input type="checkbox" [(ngModel)]="notifications.email">
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="toggle-option">
              <div class="toggle-info">
                <h4>Due Date Reminders</h4>
                <p>Get reminded before task due dates</p>
              </div>
              <label class="toggle">
                <input type="checkbox" [(ngModel)]="notifications.dueDate">
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="toggle-option">
              <div class="toggle-info">
                <h4>Weekly Summary</h4>
                <p>Receive a weekly productivity summary</p>
              </div>
              <label class="toggle">
                <input type="checkbox" [(ngModel)]="notifications.weeklySummary">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h2>Appearance</h2>
          <div class="theme-options">
            <button class="theme-btn" [class.active]="theme === 'light'" (click)="setTheme('light')">
              <div class="theme-preview light"></div>
              <span>Light</span>
            </button>
            <button class="theme-btn" [class.active]="theme === 'dark'" (click)="setTheme('dark')">
              <div class="theme-preview dark"></div>
              <span>Dark</span>
            </button>
            <button class="theme-btn" [class.active]="theme === 'auto'" (click)="setTheme('auto')">
              <div class="theme-preview auto"></div>
              <span>Auto</span>
            </button>
          </div>
        </div>

        <div class="settings-section danger-zone">
          <h2>Danger Zone</h2>
          <div class="danger-actions">
            <div class="danger-item">
              <div class="danger-info">
                <h4>Export Your Data</h4>
                <p>Download all your tasks and projects as a backup</p>
              </div>
              <button class="btn btn-secondary">Export</button>
            </div>
            <div class="danger-item">
              <div class="danger-info">
                <h4>Delete Account</h4>
                <p>Permanently delete your account and all data</p>
              </div>
              <button class="btn btn-danger">Delete Account</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-view {
      height: 100%;
      padding: 24px;
      overflow-y: auto;
    }

    .settings-header {
      margin-bottom: 32px;
    }

    .settings-header h1 {
      font-size: 28px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .settings-section {
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border-light);
      padding: 24px;
      margin-bottom: 24px;
    }

    .settings-section h2 {
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--color-text-primary);
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--color-border-light);
    }

    .profile-info {
      display: flex;
      gap: 32px;
    }

    .avatar-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: var(--color-primary);
      color: var(--color-text-light);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      font-weight: 600;
    }

    .profile-form {
      flex: 1;
      max-width: 400px;
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

    .form-group input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .notification-options {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .toggle-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      background: var(--bg-surface);
      border-radius: var(--radius-md);
    }

    .toggle-info h4 {
      font-size: var(--font-size-md);
      font-weight: 500;
      color: var(--color-text-primary);
      margin-bottom: 4px;
    }

    .toggle-info p {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }

    .toggle {
      position: relative;
      display: inline-block;
      width: 48px;
      height: 26px;
    }

    .toggle input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .toggle-slider {
      position: absolute;
      cursor: pointer;
      inset: 0;
      background: var(--color-border);
      border-radius: 26px;
      transition: all var(--transition-fast);
    }

    .toggle-slider::before {
      position: absolute;
      content: "";
      height: 20px;
      width: 20px;
      left: 3px;
      bottom: 3px;
      background: white;
      border-radius: 50%;
      transition: all var(--transition-fast);
    }

    .toggle input:checked + .toggle-slider {
      background: var(--color-primary);
    }

    .toggle input:checked + .toggle-slider::before {
      transform: translateX(22px);
    }

    .theme-options {
      display: flex;
      gap: 16px;
    }

    .theme-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 16px;
      border: 2px solid var(--color-border-light);
      border-radius: var(--radius-md);
      background: transparent;
      transition: all var(--transition-fast);
    }

    .theme-btn:hover {
      border-color: var(--color-primary-light);
    }

    .theme-btn.active {
      border-color: var(--color-primary);
    }

    .theme-preview {
      width: 60px;
      height: 40px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
    }

    .theme-preview.light {
      background: linear-gradient(135deg, #f5f5f5 50%, #fff 50%);
    }

    .theme-preview.dark {
      background: linear-gradient(135deg, #2d2d2d 50%, #1a1a1a 50%);
    }

    .theme-preview.auto {
      background: linear-gradient(135deg, #f5f5f5 50%, #2d2d2d 50%);
    }

    .theme-btn span {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }

    .danger-zone {
      border-color: rgba(184, 84, 80, 0.3);
    }

    .danger-zone h2 {
      color: var(--color-error);
    }

    .danger-actions {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .danger-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      background: rgba(184, 84, 80, 0.05);
      border-radius: var(--radius-md);
    }

    .danger-info h4 {
      font-size: var(--font-size-md);
      font-weight: 500;
      color: var(--color-text-primary);
      margin-bottom: 4px;
    }

    .danger-info p {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }

    .btn-danger {
      background: var(--color-error);
      color: white;
    }

    .btn-danger:hover {
      background: #a04844;
    }
  `]
})
export class SettingsComponent implements OnInit {
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  currentUser: AuthResponse | null = null;

  profile = {
    name: '',
    email: ''
  };

  notifications = {
    email: true,
    dueDate: true,
    weeklySummary: false
  };

  theme = 'light';

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.profile.name = this.currentUser.name;
      this.profile.email = this.currentUser.email;
    }
  }

  saveProfile(): void {
  }

  setTheme(theme: string): void {
    this.theme = theme;
  }
}
