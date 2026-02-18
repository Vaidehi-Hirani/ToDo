import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { TodayComponent } from './components/today/today.component';
import { UpcomingComponent } from './components/upcoming/upcoming.component';
import { LabelsComponent } from './components/labels/labels.component';
import { CalendarComponent } from './components/calendar/calendar.component';
import { SettingsComponent } from './components/settings/settings.component';
import { FiltersComponent } from './components/filters/filters.component';
import { StatisticsComponent } from './components/statistics/statistics.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'today',
    component: TodayComponent,
    canActivate: [authGuard]
  },
  {
    path: 'upcoming',
    component: UpcomingComponent,
    canActivate: [authGuard]
  },
  {
    path: 'labels',
    component: LabelsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'calendar',
    component: CalendarComponent,
    canActivate: [authGuard]
  },
  {
    path: 'filters',
    component: FiltersComponent,
    canActivate: [authGuard]
  },
  {
    path: 'statistics',
    component: StatisticsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '/login' }
];
