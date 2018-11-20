import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, take, tap, catchError } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/auth';
import { FirebaseuiAngularLibraryService } from 'firebaseui-angular';
import { User } from 'firebase';
import { AngularFirestore } from '@angular/fire/firestore';
import { MyUser, IUser } from 'app/models/user';
import { firestore } from 'firebase';
import Timestamp = firestore.Timestamp;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  storageKeys = {
    user: {
      uid: 'uid',
      username: 'username',
      email: 'email',
      displayName: 'displayName',
      firstName: 'firstName',
      lastName: 'lastName',
      photoURL: 'photoURL',
      isEmailVerified: 'isEmailVerified',
      isNewUser: 'isNewUser',
      signInMethod: 'signInMethod',
      portfolioUpdatedDate: 'portfolioUpdatedDate'
    },
    redirectUrl: 'redirectUrl'
  };

  constructor(
    private router: Router,
    private angularFireAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private firebaseuiAngularLibraryService: FirebaseuiAngularLibraryService
  ) {
    firebaseuiAngularLibraryService.firebaseUiInstance.disableAutoSignIn();
    // this.angularFireAuth.authState.subscribe(this.firebaseAuthChangeListener);
  }

  ngOnInit() {}

  get isAuthenticated$(): Observable<boolean> {
    return this.angularFireAuth.authState.pipe(
      map(authState => {
        var isAuthenticated = !!authState;
        console.debug('isAuthenticated', isAuthenticated);
        return isAuthenticated;
      }),
      catchError(error => of(false))
    );
  }

  _myUser: MyUser;
  get myUser$(): Observable<MyUser> {
    return this._myUser
      ? of(this._myUser)
      : this.firestore
          .collection('users')
          .doc(this.userID)
          .get()
          .pipe(
            take(1),
            map(doc => {
              var myUser = doc.data() as MyUser;
              this._myUser = myUser;
              return myUser;
            })
          );
  }

  _user: User;
  get user$(): Observable<User> {
    return this._user
      ? of(this._user)
      : this.angularFireAuth.authState.pipe(
          take(1),
          map(user => (this._user = user))
        );
  }

  get userID(): string {
    return localStorage.getItem(this.storageKeys.user.uid);
  }

  get username(): string {
    return localStorage.getItem(this.storageKeys.user.username);
  }

  get email(): string {
    return localStorage.getItem(this.storageKeys.user.email);
  }

  get displayName(): string {
    return localStorage.getItem(this.storageKeys.user.displayName);
  }

  get firstName(): string {
    return localStorage.getItem(this.storageKeys.user.firstName);
  }

  get lastName(): string {
    return localStorage.getItem(this.storageKeys.user.lastName);
  }

  get photoUrl(): string {
    return localStorage.getItem(this.storageKeys.user.photoURL);
  }

  get isNewUser(): boolean {
    return localStorage.getItem(this.storageKeys.user.isNewUser) == 'true';
  }

  get portfolioUpdatedDate(): Timestamp {
    return Timestamp.fromMillis(
      Date.parse(
        localStorage.getItem(this.storageKeys.user.portfolioUpdatedDate)
      )
    );
  }

  redirectUrl: string =
    localStorage.getItem(this.storageKeys.redirectUrl) || '/';

  setUser(myUser: MyUser) {
    this.firestore
      .collection('users')
      .doc(myUser.uid)
      .set({ ...myUser });

    this._myUser = myUser;
    this.persistAuthInfo(myUser);
  }

  updateMyUserInfo(myUser: MyUser) {
    this.firestore
      .collection('users')
      .doc(myUser.uid)
      .update({ ...myUser });

    this.persistAuthInfo(myUser);
  }

  persistAuthInfo = (myUser: MyUser) => {
    Object.keys(myUser).forEach((key, index) => {
      localStorage.setItem(key, myUser[key]);
    });
    localStorage.setItem(
      this.storageKeys.user.portfolioUpdatedDate,
      myUser.portfolioUpdatedDate.toDate().toString()
    );
  };

  logout(): void {
    var that = this;
    this.angularFireAuth.auth.signOut().then(function() {
      localStorage.clear();
      that._myUser = null;
      that._user = null;
      that.router.navigate(['login']);
    });
  }

  private firebaseAuthChangeListener(user: User) {
    if (user) {
      console.debug('Logged in :)');
    } else {
      console.debug('Logged out :(');
    }
  }
}
