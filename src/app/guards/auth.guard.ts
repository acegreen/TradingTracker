import { Injectable } from "@angular/core";
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from "@angular/router";
import { Observable } from "rxjs/Observable";
import { AuthService } from "../services/auth.service";
import { tap } from "rxjs/operators";

@Injectable({
  providedIn: "root"
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.checkLogin(state.url);
  }

  checkLogin(url: string): Observable<boolean> {
    console.debug("AuthGuard#canActivate called");
    // Store the attempted URL for redirecting
    this.authService.redirectUrl = url;
    return this.authService.isAuthenticated$.pipe(
      tap(auth => (!auth ? this.router.navigate(["login"]) : true))
    );
  }
}
