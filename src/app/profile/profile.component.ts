import { Component, OnInit } from '@angular/core';
import { AuthService } from 'app/services/auth.service';
import { tap } from 'rxjs/operators';
import { MyUser } from 'app/models/user';

declare var $: any;

@Component({
  selector: 'profile-cmp',
  moduleId: module.id,
  templateUrl: 'profile.component.html'
})
export class ProfileComponent implements OnInit {
  myUser: MyUser;
  showRecaptcha: boolean = false;

  constructor(private authService: AuthService) {
    this.authService.myUser$
      .pipe(
        tap(myUser => {
          this.myUser = myUser;
        })
      )
      .subscribe();
  }
  ngOnInit() {}

  onSubmit() {
    this.myUser.displayName =
      this.myUser.firstName + ' ' + this.myUser.lastName;

    var that = this;
    this.authService.user$
      .pipe(
        tap(user => {
          user
            .updateProfile({
              displayName: this.myUser.displayName,
              photoURL: this.myUser.photoURL
            })
            .then(function() {
              user.updateEmail(that.myUser.email);
            })
            .then(function() {
              // var applicationVerifier = new firebase.auth.RecaptchaVerifier(
              //   'recaptcha-container'
              // );
              // var provider = new firebase.auth.PhoneAuthProvider();
              // provider
              //   .verifyPhoneNumber(this.phoneNumber, applicationVerifier)
              //   .then(function(verificationId) {
              //     that.showRecaptcha = true;
              //     var verificationCode = window.prompt(
              //       'Please enter the verification ' +
              //         'code that was sent to your mobile device.'
              //     );
              //     return firebase.auth.PhoneAuthProvider.credential(
              //       verificationId,
              //       verificationCode
              //     );
              //   })
              //   .then(function(phoneCredential) {
              //     return user.updatePhoneNumber(phoneCredential).then(
              //       function() {
              //         that.showRecaptcha = false;
              //       },
              //       function(error) {
              //         that.showRecaptcha = false;
              //         // An error happened.
              //       }
              //     );
              //   });
            })
            .then(function() {
              that.authService.updateMyUserInfo(that.myUser);
            })
            .then(function() {
              that.showNotification(
                'Your profile has been updated',
                'success',
                'top',
                'center'
              );
            });
        })
      )
      .subscribe();
  }

  showNotification(message, type, from, align) {
    $.notify(
      { icon: 'ti-bell', message: message },
      { type: type, timer: 250, placement: { from: from, align: align } }
    );
  }
}
