import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { tap, map } from 'rxjs/operators';

import {
  FirebaseUISignInSuccessWithAuthResult,
  FirebaseUISignInFailure
} from 'firebaseui-angular';
import { MyUser } from 'app/models/user';

declare var $: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  errorMsg: string;
  constructor(
    private ngZone: NgZone,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {}

  successCallback(signInSuccessData: FirebaseUISignInSuccessWithAuthResult) {
    // Need to set uid early for it to be used for checks
    localStorage.setItem(
      this.authService.storageKeys.user.uid,
      signInSuccessData.authResult.user.uid
    );
    this.clearError();

    var newMyUser = new MyUser(
      signInSuccessData.authResult.user,
      signInSuccessData.authResult.additionalUserInfo,
      signInSuccessData.authResult.credential,
      signInSuccessData.redirectUrl || ''
    );
    if (signInSuccessData.authResult.additionalUserInfo.isNewUser) {
      console.debug('signInSuccessData', signInSuccessData);
      this.authService.setUser(newMyUser);
      console.debug('New User', newMyUser);
    } else {
      console.debug('signInSuccessData', signInSuccessData);
      this.authService.myUser$
        .pipe(
          tap(myUser => {
            if (myUser != null) {
              this.authService.persistAuthInfo(myUser);
              console.debug('Returning User', myUser);
            } else {
              this.authService.setUser(newMyUser);
              console.debug('Returning User, but no MyUser', newMyUser);
            }
          })
        )
        .subscribe();
    }
    this.handleSuccessufulLogin(signInSuccessData);
  }

  errorCallback(errorData: FirebaseUISignInFailure) {
    this.handleError(errorData);
  }

  private handleSuccessufulLogin = (
    signInSuccessData: FirebaseUISignInSuccessWithAuthResult
  ) => {
    this.navigate([this.authService.redirectUrl]);
  };

  private handleError = (error: FirebaseUISignInFailure) => {
    this.errorMsg = error.code;
    this.showNotification(this.errorMsg, 'warning', 'top', 'center');
  };

  private clearError() {
    this.errorMsg = '';
  }

  private navigate(commands: any[]): void {
    this.ngZone.run(() => this.router.navigate(commands));
  }

  showNotification(message, type, from, align) {
    $.notify(
      { icon: 'ti-bell', message: message },
      { type: type, timer: 250, placement: { from: from, align: align } }
    );
  }
}
