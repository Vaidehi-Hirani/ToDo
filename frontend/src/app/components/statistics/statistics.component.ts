import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TaskService, Task } from '../../services/task.service';

interface DailyStats {
  date: string;
  completed: number;
  created: number;
}

interface WeeklyStats {
  week: string;
  completed: number;
}

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="statistics-view">
      <div class="statistics-header">
        <h1>Statistics</h1>
      </div>

      <div class="statistics-content">
        <div class="stats-overview">
          <div class="stat-card">
            <div class="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div class="stat-info">
              <h3>{{ totalCompleted }}</h3>
              <p>Tasks Completed</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div class="stat-info">
              <h3>{{ currentStreak }}</h3>
              <p>Day Streak</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="20" x2="12" y2="10"/>
                <line x1="18" y1="20" x2="18" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="16"/>
              </svg>
            </div>
            <div class="stat-info">
              <h3>{{ averagePerDay }}</h3>
              <p>Avg. per Day</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <div class="stat-info">
              <h3>{{ bestDay }}</h3>
              <p>Best Day</p>
            </div>
          </div>
        </div>

        <div class="stats-section">
          <h2>Last 7 Days</h2>
          <div class="weekly-chart">
            <div class="chart-bar" *ngFor="let day of weeklyStats">
              <div class="bar-container">
                <div class="bar-fill" [style.height.%]="getBarHeight(day.completed)"></div>
              </div>
              <span class="bar-label">{{ day.label }}</span>
              <span class="bar-value">{{ day.completed }}</span>
            </div>
          </div>
        </div>

        <div class="stats-section">
          <h2>Productivity Over Time</h2>
          <div class="line-chart">
            <svg viewBox="0 0 300 100" class="chart-svg">
              <polyline
                [attr.points]="getPolylinePoints()"
                fill="none"
                stroke="var(--color-primary)"
                stroke-width="2"/>
              <circle
                *ngFor="let point of dailyStats; let i = index"
                [attr.cx]="i * 12 + 6"
                [attr.cy]="100 - (point.completed * 10)"
                r="3"
                fill="var(--color-primary)"/>
            </svg>
          </div>
        </div>

        <div class="stats-section">
          <h2>Task Status</h2>
          <div class="status-breakdown">
            <div class="status-item">
              <span class="status-dot completed"></span>
              <span class="status-label">Completed</span>
              <span class="status-value">{{ totalCompleted }}</span>
            </div>
            <div class="status-item">
              <span class="status-dot pending"></span>
              <span class="status-label">Pending</span>
              <span class="status-value">{{ totalPending }}</span>
            </div>
            <div class="status-item">
              <span class="status-dot overdue"></span>
              <span class="status-label">Overdue</span>
              <span class="status-value">{{ totalOverdue }}</span>
            </div>
          </div>
        </div>

        <div class="stats-section">
          <h2>Recent Activity</h2>
          <div class="activity-list">
            <div class="activity-item" *ngFor="let activity of recentActivity">
              <div class="activity-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div class="activity-content">
                <p>Completed "{{ activity.title }}"</p>
                <span class="activity-time">{{ activity.completedAt | date:'MMM d, h:mm a' }}</span>
              </div>
            </div>

            <div class="empty-state" *ngIf="recentActivity.length === 0">
              <p>No recent activity to show.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .statistics-view {
      height: 100%;
      padding: 24px;
      overflow-y: auto;
    }

    .statistics-header {
      margin-bottom: 32px;
    }

    .statistics-header h1 {
      font-size: 28px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .statistics-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
      max-width: 900px;
    }

    .stats-overview {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border-light);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      background: var(--color-primary-light);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-primary);
    }

    .stat-info h3 {
      font-size: 24px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin-bottom: 4px;
    }

    .stat-info p {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }

    .stats-section {
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border-light);
      padding: 24px;
    }

    .stats-section h2 {
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--color-text-primary);
      margin-bottom: 20px;
    }

    .weekly-chart {
      display: flex;
      align-items: flex-end;
      gap: 16px;
      height: 150px;
      padding: 20px 0;
    }

    .chart-bar {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .bar-container {
      width: 100%;
      height: 100px;
      background: var(--bg-surface);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: flex-end;
      overflow: hidden;
    }

    .bar-fill {
      width: 100%;
      background: var(--color-primary);
      border-radius: var(--radius-sm);
      transition: height var(--transition-normal);
    }

    .bar-label {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }

    .bar-value {
      font-size: var(--font-size-sm);
      font-weight: 500;
      color: var(--color-text-primary);
    }

    .line-chart {
      height: 120px;
    }

    .chart-svg {
      width: 100%;
      height: 100%;
    }

    .status-breakdown {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: var(--bg-surface);
      border-radius: var(--radius-md);
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .status-dot.completed {
      background: var(--color-success);
    }

    .status-dot.pending {
      background: var(--color-warning);
    }

    .status-dot.overdue {
      background: var(--color-error);
    }

    .status-label {
      flex: 1;
      font-size: var(--font-size-md);
      color: var(--color-text-primary);
    }

    .status-value {
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .activity-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      background: var(--bg-surface);
      border-radius: var(--radius-md);
    }

    .activity-icon {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(107, 142, 107, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-success);
      flex-shrink: 0;
    }

    .activity-content p {
      font-size: var(--font-size-sm);
      color: var(--color-text-primary);
      margin-bottom: 4px;
    }

    .activity-time {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }

    .empty-state {
      text-align: center;
      padding: 24px;
      color: var(--color-text-muted);
    }

    @media (max-width: 768px) {
      .stats-overview {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class StatisticsComponent implements OnInit {
  private taskService = inject(TaskService);
  private destroyRef = inject(DestroyRef);

  totalCompleted = 0;
  totalPending = 0;
  totalOverdue = 0;
  currentStreak = 0;
  averagePerDay = 0;
  bestDay = 'Monday';

  weeklyStats: { label: string; completed: number }[] = [];
  dailyStats: DailyStats[] = [];
  recentActivity: Task[] = [];

  ngOnInit(): void {
    this.loadStatistics();
  }

  loadStatistics(): void {
    this.taskService.getTasks()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tasks) => {
          this.totalCompleted = tasks.filter(t => t.isCompleted).length;
          this.totalPending = tasks.filter(t => !t.isCompleted).length;
          this.totalOverdue = tasks.filter(t => !t.isCompleted && t.dueDate && new Date(t.dueDate) < new Date()).length;

          this.calculateWeeklyStats(tasks);
          this.calculateRecentActivity(tasks);
        }
      });
  }

  calculateWeeklyStats(tasks: Task[]): void {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    this.weeklyStats = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const completed = tasks.filter(t => {
        if (!t.completedAt) return false;
        return t.completedAt.startsWith(dateStr);
      }).length;

      this.weeklyStats.push({
        label: i === 0 ? 'Today' : days[date.getDay()],
        completed
      });
    }

    this.currentStreak = this.calculateStreak(this.weeklyStats);
    this.averagePerDay = Math.round(this.totalCompleted / 7);
  }

  calculateStreak(weekly: { completed: number }[]): number {
    let streak = 0;
    for (let i = weekly.length - 1; i >= 0; i--) {
      if (weekly[i].completed > 0) {
        streak++;
      } else if (i === weekly.length - 1) {
        continue;
      } else {
        break;
      }
    }
    return streak;
  }

  calculateRecentActivity(tasks: Task[]): void {
    this.recentActivity = tasks
      .filter(t => t.isCompleted && t.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
      .slice(0, 5);
  }

  getBarHeight(completed: number): number {
    const max = Math.max(...this.weeklyStats.map(d => d.completed), 1);
    return (completed / max) * 100;
  }

  getPolylinePoints(): string {
    if (this.dailyStats.length === 0) return '';

    const max = Math.max(...this.dailyStats.map(d => d.completed), 1);
    const points = this.dailyStats.map((d, i) => {
      const x = i * 12 + 6;
      const y = 100 - (d.completed / max) * 80;
      return `${x},${y}`;
    });

    return points.join(' ');
  }
}
