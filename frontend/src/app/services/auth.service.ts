import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

declare const google: any;

export interface AuthResponse {
  token: string;
  refreshToken: string;
  id: number;
  name: string;
  email: string;
  isNewUser?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private currentUserSubject = new BehaviorSubject<AuthResponse | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  initGoogleSignIn(buttonElement: HTMLElement): void {
    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: any) => this.handleGoogleResponse(response),
      auto_select: false,
      cancel_on_tap_outside: true
    });

    google.accounts.id.renderButton(
      buttonElement,
      {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left'
      }
    );
  }

  private handleGoogleResponse(response: any): void {
    const idToken = response.credential;

    // Use the public method for better subscription management
    this.googleSignIn(idToken).subscribe({
      next: (user) => {
        console.log('Google Sign-In successful:', user);
        // Navigate to dashboard (handled by component)
        window.location.href = '/dashboard';
      },
      error: (error) => {
        console.error('Google Sign-In failed:', error);
        alert('Failed to sign in with Google');
      }
    });
  }

  googleSignIn(idToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/users/google-signin`, {
      idToken: idToken
    }).pipe(
      tap(user => {
        // Store tokens and user info
        localStorage.setItem('token', user.token);
        localStorage.setItem('refreshToken', user.refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  regularLogin(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/users/login`, {
      email,
      password
    }).pipe(
      tap(user => {
        localStorage.setItem('token', user.token);
        localStorage.setItem('refreshToken', user.refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  register(name: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/users/register`, {
      name,
      email,
      password
    }).pipe(
      tap(user => {
        localStorage.setItem('token', user.token);
        localStorage.setItem('refreshToken', user.refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    if (typeof google !== 'undefined' && google.accounts) {
      google.accounts.id.disableAutoSelect();
    }
  }

  refreshToken(): Observable<AuthResponse> {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');

    return this.http.post<AuthResponse>(`${environment.apiUrl}/users/refresh-token`, {
      token,
      refreshToken
    }).pipe(
      tap(user => {
        localStorage.setItem('token', user.token);
        localStorage.setItem('refreshToken', user.refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  getCurrentUser(): AuthResponse | null {
    return this.currentUserSubject.value;
  }
}
