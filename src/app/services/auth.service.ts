import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import config from '../../config';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private authStatus = new BehaviorSubject<boolean>(false);
  authStatus$ = this.authStatus.asObservable();

  private loggedIn$ = new BehaviorSubject<boolean>(
    !!localStorage.getItem('ticketPress_token')
  );
  isLoggedIn$ = this.loggedIn$.asObservable();

  private refreshComponents = new BehaviorSubject<boolean>(false);
  refreshComponents$ = this.refreshComponents.asObservable();

  private authStateChange = new BehaviorSubject<boolean>(false);

  private authState = new BehaviorSubject<{
    isAuthenticated: boolean;
    token: string | null;
    empNo: string | null;
  }>({
    isAuthenticated: !!localStorage.getItem('ticketPress_token'),
    token: localStorage.getItem('ticketPress_token'),
    empNo: localStorage.getItem('ticketPress_empNo'),
  });

  authState$ = this.authState.asObservable();

  constructor(private router: Router, private http: HttpClient) {}

  login(userData: any) {
    localStorage.setItem('ticketPress_token', userData.token || '');
    localStorage.setItem('ticketPress_name', userData.name || '');
    localStorage.setItem('ticketPress_userId', userData.id || '');
    localStorage.setItem('ticketPress_empNo', userData.empNo || '');
    localStorage.setItem('ticketPress_sectionName', userData.sectionName || '');
    localStorage.setItem('ticketPress_sectionId', userData.sectionId || '');
    localStorage.setItem('ticketPress_groupName', userData.groupName || '');
    localStorage.setItem('ticketPress_groupId', userData.groupId || '');
    localStorage.setItem('ticketPress_role', userData.role || '');

    this.authStatus.next(true);
    this.loggedIn$.next(true);
    this.refreshComponents.next(true);

    this.authState.next({
      isAuthenticated: true,
      token: userData.token || '',
      empNo: userData.empNo || '',
    });
  }

  logout() {
    localStorage.removeItem('ticketPress_token');
    localStorage.removeItem('ticketPress_name');
    localStorage.removeItem('ticketPress_userId');
    localStorage.removeItem('ticketPress_empNo');
    localStorage.removeItem('ticketPress_sectionName');
    localStorage.removeItem('ticketPress_sectionId');
    localStorage.removeItem('ticketPress_groupName');
    localStorage.removeItem('ticketPress_groupId');
    localStorage.removeItem('ticketPress_role');

    this.authStatus.next(false);
    this.loggedIn$.next(false);
    this.refreshComponents.next(true);

    this.authState.next({
      isAuthenticated: false,
      token: null,
      empNo: null,
    });

    this.router.navigate(['/']);
  }

  getUserLevel() {
    const token = localStorage.getItem('ticketPress_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get(config.apiServer + '/api/user/getLevelFromToken', {
      headers,
    });
  }

  updateAuthStatus(status: boolean) {
    this.authStatus.next(status);
    this.loggedIn$.next(status);
  }

  notifyLogin() {
    this.authStateChange.next(true);
  }
}