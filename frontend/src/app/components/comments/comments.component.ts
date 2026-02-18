import { Component, Input, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TaskService } from '../../services/task.service';

interface TaskComment {
  id: number;
  content: string;
  createdAt: string;
  userName: string;
  userAvatar?: string;
}

@Component({
  selector: 'app-comments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="comments-section">
      <div class="comments-header">
        <h3>Comments</h3>
        <span class="comment-count">{{ comments.length }}</span>
      </div>

      <div class="comment-form">
        <textarea
          [(ngModel)]="newComment"
          placeholder="Add a comment..."
          rows="2">
        </textarea>
        <button
          class="btn btn-primary btn-sm"
          (click)="addComment()"
          [disabled]="!newComment.trim()">
          Comment
        </button>
      </div>

      <div class="comments-list">
        <div class="comment-item" *ngFor="let comment of comments">
          <div class="comment-avatar">{{ comment.userName.charAt(0) }}</div>
          <div class="comment-content">
            <div class="comment-header">
              <span class="comment-author">{{ comment.userName }}</span>
              <span class="comment-time">{{ comment.createdAt | date:'MMM d, h:mm a' }}</span>
            </div>
            <p class="comment-text">{{ comment.content }}</p>
          </div>
          <button class="delete-comment-btn" (click)="deleteComment(comment.id)" *ngIf="canDeleteComment(comment)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
            </svg>
          </button>
        </div>

        <div class="empty-state" *ngIf="comments.length === 0">
          <p>No comments yet. Be the first to comment!</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .comments-section {
      padding: 20px;
      border-top: 1px solid var(--color-border-light);
    }

    .comments-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }

    .comments-header h3 {
      font-size: var(--font-size-md);
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .comment-count {
      font-size: var(--font-size-xs);
      font-weight: 500;
      padding: 2px 8px;
      background: var(--bg-surface);
      border-radius: 10px;
      color: var(--color-text-muted);
    }

    .comment-form {
      margin-bottom: 20px;
    }

    .comment-form textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      resize: none;
      margin-bottom: 8px;
      font-size: var(--font-size-sm);
    }

    .comment-form textarea:focus {
      border-color: var(--color-primary);
    }

    .comments-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .comment-item {
      display: flex;
      gap: 12px;
      position: relative;
    }

    .comment-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--color-primary);
      color: var(--color-text-light);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: var(--font-size-sm);
      flex-shrink: 0;
    }

    .comment-content {
      flex: 1;
    }

    .comment-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .comment-author {
      font-size: var(--font-size-sm);
      font-weight: 500;
      color: var(--color-text-primary);
    }

    .comment-time {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }

    .comment-text {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      line-height: 1.5;
    }

    .delete-comment-btn {
      position: absolute;
      top: 0;
      right: 0;
      padding: 4px;
      border-radius: var(--radius-sm);
      color: var(--color-text-muted);
      opacity: 0;
      transition: opacity var(--transition-fast);
    }

    .comment-item:hover .delete-comment-btn {
      opacity: 1;
    }

    .delete-comment-btn:hover {
      background: rgba(184, 84, 80, 0.1);
      color: var(--color-error);
    }

    .empty-state {
      text-align: center;
      padding: 24px;
      color: var(--color-text-muted);
    }

    .empty-state p {
      font-size: var(--font-size-sm);
    }
  `]
})
export class CommentsComponent {
  @Input() taskId!: number;
  @Input() currentUserId?: number;

  private taskService = inject(TaskService);
  private destroyRef = inject(DestroyRef);

  comments: TaskComment[] = [];
  newComment = '';

  ngOnInit(): void {
    this.loadComments();
  }

  loadComments(): void {
    this.taskService.getComments(this.taskId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (comments) => {
          this.comments = comments;
        }
      });
  }

  addComment(): void {
    if (!this.newComment.trim()) return;

    this.taskService.createComment(this.taskId, this.newComment)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (comment) => {
          this.comments.push(comment);
          this.newComment = '';
        }
      });
  }

  deleteComment(commentId: number): void {
    if (confirm('Delete this comment?')) {
      this.taskService.deleteComment(this.taskId, commentId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.comments = this.comments.filter(c => c.id !== commentId);
          }
        });
    }
  }

  canDeleteComment(comment: TaskComment): boolean {
    return true;
  }
}
