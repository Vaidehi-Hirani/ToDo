import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Integration {
  id: string;
  name: string;
  type: 'calendar' | 'email' | 'slack' | 'other';
  isConnected: boolean;
  icon?: string;
}

export interface CalendarIntegration {
  provider: 'google' | 'outlook';
  isConnected: boolean;
  calendarId?: string;
  syncEnabled: boolean;
}

export interface EmailIntegration {
  provider: 'gmail' | 'outlook';
  isConnected: boolean;
  email?: string;
  syncEnabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class IntegrationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/integrations`;

  getIntegrations(): Observable<Integration[]> {
    return this.http.get<Integration[]>(this.apiUrl);
  }

  connectCalendar(provider: 'google' | 'outlook'): Observable<any> {
    return this.http.post(`${this.apiUrl}/calendar/connect`, { provider });
  }

  disconnectCalendar(provider: 'google' | 'outlook'): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/calendar/${provider}`);
  }

  getCalendarIntegration(provider: 'google' | 'outlook'): Observable<CalendarIntegration> {
    return this.http.get<CalendarIntegration>(`${this.apiUrl}/calendar/${provider}`);
  }

  syncCalendar(provider: 'google' | 'outlook'): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/calendar/${provider}/sync`, {});
  }

  connectEmail(provider: 'gmail' | 'outlook'): Observable<any> {
    return this.http.post(`${this.apiUrl}/email/connect`, { provider });
  }

  disconnectEmail(provider: 'gmail' | 'outlook'): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/email/${provider}`);
  }

  getEmailIntegration(provider: 'gmail' | 'outlook'): Observable<EmailIntegration> {
    return this.http.get<EmailIntegration>(`${this.apiUrl}/email/${provider}`);
  }

  getWebhooks(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/webhooks`);
  }

  createWebhook(url: string, events: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/webhooks`, { url, events });
  }

  deleteWebhook(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/webhooks/${id}`);
  }
}
