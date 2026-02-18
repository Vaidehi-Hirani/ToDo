import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type RecurringType = 
  | 'none' 
  | 'daily' 
  | 'weekly' 
  | 'biweekly' 
  | 'monthly' 
  | 'quarterly' 
  | 'yearly'
  | 'custom';

export interface Task {
  id: number;
  title: string;
  description?: string;
  isCompleted: boolean;
  dueDate?: string;
  priority?: 'High' | 'Medium' | 'Low' | undefined;
  category?: string;
  repeatType?: RecurringType;
  repeatCustom?: RepeatCustom;
  projectId?: number;
  projectName?: string;
  labels?: Label[];
  subtasks?: Subtask[];
  labelIds?: number[];
  createdAt: string;
  completedAt?: string;
  startDate?: string;
  notes?: string;
  assignerId?: number;
  assigneeId?: number;
  isRecurring?: boolean;
  parentTaskId?: number;
  nextDueDate?: string;
}

export interface RepeatCustom {
  frequency: number;
  interval: 'day' | 'week' | 'month' | 'year';
  daysOfWeek?: number[];
  dayOfMonth?: number;
  monthOfYear?: number;
  endDate?: string;
  occurrences?: number;
}

export interface Subtask {
  id: number;
  title: string;
  isCompleted: boolean;
  taskId: number;
}

export interface Label {
  id: number;
  name: string;
  color: string;
  taskCount?: number;
}

export interface TaskComment {
  id: number;
  content: string;
  createdAt: string;
  userName: string;
  userAvatar?: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: string;
  category?: string;
  repeatType?: RecurringType;
  repeatCustom?: RepeatCustom;
  projectId?: number;
  labelIds?: number[];
  startDate?: string;
  notes?: string;
  assigneeId?: number;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  isCompleted?: boolean;
  dueDate?: string;
  priority?: string;
  category?: string;
  repeatType?: RecurringType;
  repeatCustom?: RepeatCustom;
  projectId?: number;
  labelIds?: number[];
  startDate?: string;
  notes?: string;
  assigneeId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tasks`;

  getTasks(projectId?: number): Observable<Task[]> {
    const url = projectId ? `${this.apiUrl}?projectId=${projectId}` : this.apiUrl;
    return this.http.get<Task[]>(url);
  }

  getTask(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${id}`);
  }

  getTodayTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/today`);
  }

  getOverdueTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/overdue`);
  }

  getUpcomingTasks(days: number = 14): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/upcoming?days=${days}`);
  }

  getTasksByLabel(labelId: number): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}?labelId=${labelId}`);
  }

  createTask(task: CreateTaskDto): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, task);
  }

  updateTask(id: number, task: UpdateTaskDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, task);
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  toggleTaskCompletion(id: number, isCompleted: boolean): Observable<void> {
    return this.updateTask(id, { isCompleted });
  }

  getLabels(): Observable<Label[]> {
    return this.http.get<Label[]>(`${environment.apiUrl}/labels`);
  }

  getLabel(id: number): Observable<Label> {
    return this.http.get<Label>(`${environment.apiUrl}/labels/${id}`);
  }

  createLabel(label: { name: string; color: string }): Observable<Label> {
    return this.http.post<Label>(`${environment.apiUrl}/labels`, label);
  }

  updateLabel(id: number, label: { name: string; color: string }): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}/labels/${id}`, label);
  }

  deleteLabel(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/labels/${id}`);
  }

  getSubtasks(taskId: number): Observable<Subtask[]> {
    return this.http.get<Subtask[]>(`${this.apiUrl}/${taskId}/subtasks`);
  }

  createSubtask(taskId: number, title: string): Observable<Subtask> {
    return this.http.post<Subtask>(`${this.apiUrl}/${taskId}/subtasks`, { title });
  }

  updateSubtask(taskId: number, subtaskId: number, data: Partial<Subtask>): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${taskId}/subtasks/${subtaskId}`, data);
  }

  deleteSubtask(taskId: number, subtaskId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${taskId}/subtasks/${subtaskId}`);
  }

  getComments(taskId: number): Observable<TaskComment[]> {
    return this.http.get<TaskComment[]>(`${this.apiUrl}/${taskId}/comments`);
  }

  createComment(taskId: number, content: string): Observable<TaskComment> {
    return this.http.post<TaskComment>(`${this.apiUrl}/${taskId}/comments`, { content });
  }

  deleteComment(taskId: number, commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${taskId}/comments/${commentId}`);
  }

  getRecurringTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/recurring`);
  }

  createRecurringCopy(taskId: number): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/${taskId}/create-recurring`, {});
  }

  skipRecurringOccurrence(taskId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${taskId}/skip-recurring`, {});
  }

  getRecurrencePreview(task: CreateTaskDto, count: number = 5): Observable<string[]> {
    return this.http.post<string[]>(`${this.apiUrl}/recurrence/preview`, { task, count });
  }
}
