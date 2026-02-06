import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Attempt token refresh if not already refreshing
        const refreshToken = authService.getRefreshToken();
        if (refreshToken && !req.url.includes('refresh-token')) {
          return authService.refreshToken().pipe(
            switchMap((response) => {
              // Retry original request with new token
              const clonedReq = req.clone({
                setHeaders: { Authorization: `Bearer ${response.token}` }
              });
              return next(clonedReq);
            }),
            catchError((refreshError) => {
              // Refresh failed, logout and redirect to login
              authService.logout();
              router.navigate(['/login']);
              return throwError(() => refreshError);
            })
          );
        } else {
          // No refresh token or already trying to refresh, logout
          authService.logout();
          router.navigate(['/login']);
        }
      }

      if (error.status === 403) {
        console.error('Forbidden access');
        alert('You do not have permission to access this resource');
      }

      if (error.status === 0) {
        console.error('Network error - unable to reach the server');
        alert('Unable to connect to the server. Please check your internet connection.');
      }

      return throwError(() => error);
    })
  );
};
