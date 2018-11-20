import { environment } from '../environments/environment';

import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { AppRoutes, AppRoutingModule } from './app.routing';
import { SidebarModule } from './shared/sidebar/sidebar.module';
import { FooterModule } from './shared/footer/footer.module';
import { NavbarModule } from './shared/navbar/navbar.module';
import { FixedPluginModule } from './shared/fixedplugin/fixedplugin.module';
import { NguiMapModule } from '@ngui/map';

import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PortfolioComponent } from './portfolio/portfolio.component';
import { TradeComponent } from './trade/trade.component';
import { ProfileComponent } from './profile/profile.component';

import { FirebaseUIModule, firebase, firebaseui } from 'firebaseui-angular';
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { AngularFireAuthModule } from '@angular/fire/auth';
import {
  AngularFireFunctionsModule,
  FunctionsRegionToken
} from '@angular/fire/functions';
import { ReCaptchaModule } from 'angular2-recaptcha';
import { PapaParseModule } from 'ngx-papaparse';

const firebaseUiAuthConfig: firebaseui.auth.Config = {
  signInFlow: 'popup',
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    {
      scopes: ['public_profile', 'email'],
      customParameters: {
        auth_type: 'reauthenticate'
      },
      provider: firebase.auth.FacebookAuthProvider.PROVIDER_ID
    },
    firebase.auth.TwitterAuthProvider.PROVIDER_ID,
    // firebase.auth.GithubAuthProvider.PROVIDER_ID,
    {
      requireDisplayName: true,
      provider: firebase.auth.EmailAuthProvider.PROVIDER_ID
    }
    // firebase.auth.PhoneAuthProvider.PROVIDER_ID,
    // firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID
  ],
  tosUrl: 'https://www.websitepolicies.com/policies/view/PDXKn9wV',
  privacyPolicyUrl: 'https://www.websitepolicies.com/policies/view/5O7QYE4X',
  credentialHelper: firebaseui.auth.CredentialHelper.ACCOUNT_CHOOSER_COM
};

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    PortfolioComponent,
    TradeComponent,
    ProfileComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    ReCaptchaModule,
    RouterModule.forRoot(AppRoutes),
    SidebarModule,
    NavbarModule,
    FooterModule,
    FixedPluginModule,
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule,
    AngularFireAuthModule,
    AngularFireStorageModule,
    AngularFireFunctionsModule,
    FirebaseUIModule.forRoot(firebaseUiAuthConfig),
    PapaParseModule,
    NguiMapModule.forRoot({
      apiUrl: 'https://maps.google.com/maps/api/js?key=YOUR_KEY_HERE'
    })
  ],
  providers: [{ provide: FunctionsRegionToken, useValue: 'us-central1' }],
  bootstrap: [AppComponent]
})
export class AppModule {}
