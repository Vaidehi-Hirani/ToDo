import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Project {
  id: number;
  name: string;
  description?: string;
  dueDate?: string;
  taskCount: number;
  completedTaskCount: number;
  createdAt: string;
  color?: string;
  isFavorite?: boolean;
  parentId?: number;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  dueDate?: string;
  color?: string;
  parentId?: number;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  dueDate?: string;
  color?: string;
  isFavorite?: boolean;
  parentId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/projects`;

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.apiUrl);
  }

  getProject(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/${id}`);
  }

  createProject(project: CreateProjectDto): Observable<Project> {
    return this.http.post<Project>(this.apiUrl, project);
  }

  updateProject(id: number, project: UpdateProjectDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, project);
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getFavoriteProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/favorites`);
  }

  toggleFavorite(projectId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${projectId}/favorite`, {});
  }
}
