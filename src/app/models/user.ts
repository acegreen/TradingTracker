import { User, UserInfo } from 'firebase';
import { firestore } from 'firebase';
import Timestamp = firestore.Timestamp;

export interface IUser {
  company: string;
  displayName: string;
  email: string;
  userName: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  aboutMe: string;
  photoURL: string;
  providerId: string;
  uid: string;
  isAnonymous: boolean;
  isEmailVerified: boolean;
  isNewUser: boolean;
  providerData: UserInfo;
  signInMethod: string;
  redirectURL: string;
  portfolioUpdatedDate: Timestamp;
}

export class MyUser implements IUser {
  company: string;
  displayName: string | null;
  email: string | null;
  userName: string | null;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  postalCode: string | null;
  aboutMe: string | null;
  photoURL: string | null;
  providerId: string | null;
  uid: string;
  isAnonymous: boolean;
  isEmailVerified: boolean;
  isNewUser: boolean;
  providerData: UserInfo | null;
  signInMethod: string;
  redirectURL: string | null;
  portfolioUpdatedDate: Timestamp | null;
  constructor(
    user: User,
    additionalUserInfo: firebase.auth.AdditionalUserInfo,
    credentials: firebase.auth.AuthCredential,
    redirectURL: string
  ) {
    this.company = '';
    this.displayName = user.displayName || null;
    user.email != null
      ? (this.email = user.email)
      : user.providerData[0].email || null;
    this.userName = additionalUserInfo.username || null;
    this.firstName = this.displayName.split(' ').shift();
    this.lastName = this.displayName.split(' ').pop();
    this.phoneNumber = user.phoneNumber || '';
    this.photoURL = user.photoURL || null;
    this.providerId = user.providerId;
    this.uid = user.uid;
    this.isAnonymous = user.isAnonymous;
    this.isEmailVerified = user.emailVerified;
    this.isNewUser = additionalUserInfo.isNewUser;
    this.providerData = { ...user.providerData[0] };
    this.signInMethod = credentials.signInMethod;
    this.redirectURL = redirectURL;
    this.portfolioUpdatedDate = Timestamp.fromDate(new Date('1970/01/01'));
  }
}
