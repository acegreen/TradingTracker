import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'app/services/auth.service';

declare var $: any;

export interface RouteInfo {
  path: string;
  title: string;
  icon: string;
  class: string;
}

export const ROUTES: RouteInfo[] = [
  { path: 'dashboard', title: 'Dashboard', icon: 'ti-view-grid', class: '' },
  { path: 'portfolio', title: 'Portfolio', icon: 'ti-pie-chart', class: '' },
  { path: 'trades', title: 'Trades', icon: 'ti-list', class: '' },
  { path: 'profile', title: 'Profile', icon: 'ti-user', class: '' }
];

@Component({
  moduleId: module.id,
  selector: 'sidebar-cmp',
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent implements OnInit {
  public menuItems: any[];
  constructor(private router: Router, private authService: AuthService) {}
  ngOnInit() {
    this.menuItems = ROUTES.filter(menuItem => menuItem);
  }
  isMobileMenu() {
    if ($(window).width() > 991) {
      return false;
    }
    return true;
  }

  logout() {
    this.authService.logout();
  }
}
