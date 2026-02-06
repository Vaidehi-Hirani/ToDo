# Google Sign-In Implementation Guide for Angular

## Backend Setup (✓ Complete)

The backend is already configured with:
- Google.Apis.Auth NuGet package installed
- `/api/users/google-signin` endpoint created
- Token verification and auto-user creation implemented
- JWT token issuance configured

**Important:** Update `appsettings.json` with your actual Google Client ID:
```json
"Google": {
  "ClientId": "YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com"
}
```

---

## Frontend Setup (Angular)

### Step 1: Get Google Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen
6. Create Web application credentials
7. Add authorized JavaScript origins:
   - `http://localhost:4200` (for development)
   - Your production domain
8. Copy the Client ID

### Step 2: Install Google Sign-In Library

```bash
npm install @types/google.accounts
```

### Step 3: Add Google Script to index.html

Add this to your `src/index.html` in the `<head>` section:

```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

### Step 4: Create Environment Configuration

Add to `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5209/api',
  googleClientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com'
};
```

### Step 5: Create Auth Service

Create `src/app/services/auth.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

declare const google: any;

export interface AuthResponse {
  token: string;
  id: number;
  name: string;
  email: string;
  isNewUser?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<AuthResponse | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
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

    this.http.post<AuthResponse>(`${environment.apiUrl}/users/google-signin`, {
      idToken: idToken
    }).pipe(
      tap(user => {
        // Store token and user info
        localStorage.setItem('token', user.token);
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    ).subscribe({
      next: (user) => {
        console.log('Google Sign-In successful:', user);
        if (user.isNewUser) {
          console.log('Welcome! New user created.');
        }
        // Navigate to dashboard or home
        // this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Google Sign-In failed:', error);
        alert('Failed to sign in with Google');
      }
    });
  }

  regularLogin(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/users/login`, {
      email,
      password
    }).pipe(
      tap(user => {
        localStorage.setItem('token', user.token);
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    google.accounts.id.disableAutoSelect();
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
```

### Step 6: Create Login Component

Create `src/app/components/login/login.component.ts`:

```typescript
import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, AfterViewInit {
  @ViewChild('googleButton', { static: false }) googleButton!: ElementRef;

  email: string = '';
  password: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  ngAfterViewInit(): void {
    // Initialize Google Sign-In button
    if (this.googleButton) {
      this.authService.initGoogleSignIn(this.googleButton.nativeElement);
    }
  }

  onRegularLogin(): void {
    this.isLoading = true;
    this.authService.regularLogin(this.email, this.password).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Login failed:', error);
        alert('Invalid credentials');
        this.isLoading = false;
      }
    });
  }
}
```

### Step 7: Create Login Template

Create `src/app/components/login/login.component.html`:

```html
<div class="login-container">
  <div class="login-card">
    <h2>Sign In to ToDo App</h2>

    <!-- Google Sign-In Button -->
    <div class="google-signin-section">
      <div #googleButton></div>
    </div>

    <div class="divider">
      <span>OR</span>
    </div>

    <!-- Regular Login Form -->
    <form (ngSubmit)="onRegularLogin()" class="login-form">
      <div class="form-group">
        <label for="email">Email</label>
        <input
          type="email"
          id="email"
          [(ngModel)]="email"
          name="email"
          placeholder="Enter your email"
          required
        />
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input
          type="password"
          id="password"
          [(ngModel)]="password"
          name="password"
          placeholder="Enter your password"
          required
        />
      </div>

      <button
        type="submit"
        class="login-button"
        [disabled]="isLoading"
      >
        {{ isLoading ? 'Signing in...' : 'Sign In' }}
      </button>
    </form>

    <div class="register-link">
      Don't have an account? <a routerLink="/register">Register</a>
    </div>
  </div>
</div>
```

### Step 8: Add Styles

Create `src/app/components/login/login.component.css`:

```css
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
  font-size: 24px;
}

.google-signin-section {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.divider {
  text-align: center;
  margin: 20px 0;
  position: relative;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 45%;
  height: 1px;
  background: #ddd;
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.divider span {
  background: white;
  padding: 0 10px;
  color: #999;
  font-size: 14px;
}

.login-form {
  margin-top: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;
  font-size: 14px;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.login-button {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.3s;
}

.login-button:hover {
  opacity: 0.9;
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.register-link {
  text-align: center;
  margin-top: 20px;
  color: #666;
  font-size: 14px;
}

.register-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.register-link a:hover {
  text-decoration: underline;
}
```

### Step 9: Create HTTP Interceptor for JWT

Create `src/app/interceptors/auth.interceptor.ts`:

```typescript
import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();

    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request);
  }
}
```

### Step 10: Register Interceptor in app.module.ts

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

---

## Testing the Implementation

### 1. Update Backend Configuration
Edit `appsettings.json`:
```json
"Google": {
  "ClientId": "YOUR_ACTUAL_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
}
```

### 2. Start Backend
```bash
cd ToDo.Api
dotnet run
```
Backend will run on: `http://localhost:5209`

### 3. Update Angular Environment
Edit `src/environments/environment.ts`:
```typescript
googleClientId: 'YOUR_ACTUAL_GOOGLE_CLIENT_ID.apps.googleusercontent.com'
```

### 4. Start Angular App
```bash
cd your-angular-app
ng serve
```
Frontend will run on: `http://localhost:4200`

### 5. Test Google Sign-In
1. Navigate to `http://localhost:4200/login`
2. Click "Sign in with Google" button
3. Select your Google account
4. Backend will:
   - Verify the Google ID token
   - Create user automatically if new
   - Issue JWT token
5. Frontend will:
   - Store JWT token
   - Store user info
   - Redirect to dashboard

---

## API Endpoint Details

### POST `/api/users/google-signin`

**Request:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjU..."
}
```

**Success Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "id": 1,
  "name": "John Doe",
  "email": "john.doe@gmail.com",
  "isNewUser": false
}
```

**Error Response (400 Bad Request):**
```json
{
  "message": "Failed to authenticate with Google",
  "error": "Invalid token"
}
```

---

## Security Notes

1. **NEVER** commit Google Client ID to public repositories
2. Use environment variables for production
3. Always verify tokens on the backend
4. Store JWT tokens securely (HttpOnly cookies recommended for production)
5. Implement token refresh mechanism for long sessions
6. Add CORS configuration for production domains

---

## Troubleshooting

### Issue: "Invalid Google token"
- Verify Google Client ID matches in both frontend and backend
- Check if token is not expired
- Ensure Google Cloud Console project is properly configured

### Issue: "CORS error"
- Add CORS middleware in backend Program.cs:
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular",
        builder => builder
            .WithOrigins("http://localhost:4200")
            .AllowAnyMethod()
            .AllowAnyHeader());
});

// After app.Build()
app.UseCors("AllowAngular");
```

### Issue: Google button not rendering
- Verify Google script is loaded in index.html
- Check browser console for errors
- Ensure `@types/google.accounts` is installed

---

## Complete Flow Diagram

```
User clicks "Sign in with Google"
        ↓
Google OAuth popup opens
        ↓
User selects account
        ↓
Google returns ID token to frontend
        ↓
Frontend sends ID token to: POST /api/users/google-signin
        ↓
Backend verifies token with Google
        ↓
Backend checks if user exists
        ↓
If new user → Create user in database
        ↓
Backend generates JWT token
        ↓
Backend returns: { token, id, name, email }
        ↓
Frontend stores token and user info
        ↓
User is authenticated and redirected
```

---

## Next Steps

1. ✓ Get Google Client ID from Google Cloud Console
2. ✓ Update `appsettings.json` with Client ID
3. ✓ Implement Angular components following this guide
4. ✓ Test the complete flow
5. Add user profile management
6. Implement token refresh
7. Add logout functionality
8. Deploy to production

---

**Implementation Complete!** 🎉

The backend is ready. Follow the Angular guide above to complete the frontend integration.
