import {
  Component,
  OnInit,
  Renderer,
  ViewChild,
  ElementRef
} from "@angular/core";
import { ROUTES } from "../sidebar/sidebar.component";
import { Router, ActivatedRoute } from "@angular/router";
import {
  Location,
  LocationStrategy,
  PathLocationStrategy
} from "@angular/common";
import { AngularFireAuth } from "@angular/fire/auth";
import { AuthService } from "app/services/auth.service";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

@Component({
  moduleId: module.id,
  selector: "navbar-cmp",
  templateUrl: "navbar.component.html"
})
export class NavbarComponent implements OnInit {
  private listTitles: any[];
  location: Location;
  private nativeElement: Node;
  private toggleButton;
  private sidebarVisible: boolean;

  @ViewChild("navbar-cmp") button;

  constructor(
    private router: Router,
    private authService: AuthService,
    location: Location,
    private renderer: Renderer,
    private element: ElementRef,
    private angularFireAuth: AngularFireAuth
  ) {
    this.location = location;
    this.nativeElement = element.nativeElement;
    this.sidebarVisible = false;
  }

  ngOnInit() {
    this.listTitles = ROUTES.filter(listTitle => listTitle);
    var navbar: HTMLElement = this.element.nativeElement;
    this.toggleButton = navbar.getElementsByClassName("navbar-toggle")[0];
  }

  getTitle() {
    var titlee = window.location.pathname;
    titlee = titlee.substring(1);
    for (var item = 0; item < this.listTitles.length; item++) {
      if (this.listTitles[item].path === titlee) {
        return this.listTitles[item].title;
      }
    }
    return "";
  }

  getIcon() {
    var titlee = window.location.pathname;
    titlee = titlee.substring(1);
    for (var item = 0; item < this.listTitles.length; item++) {
      if (this.listTitles[item].path === titlee) {
        return this.listTitles[item].icon;
      }
    }
    return "";
  }

  sidebarToggle() {
    var toggleButton = this.toggleButton;
    var body = document.getElementsByTagName("body")[0];

    if (this.sidebarVisible == false) {
      setTimeout(function() {
        toggleButton.classList.add("toggled");
      }, 500);
      body.classList.add("nav-open");
      this.sidebarVisible = true;
    } else {
      this.toggleButton.classList.remove("toggled");
      this.sidebarVisible = false;
      body.classList.remove("nav-open");
    }
  }

  logout() {
    this.authService.logout();
  }

  show(): Observable<boolean> {
    return this.authService.isAuthenticated$;
  }
}
