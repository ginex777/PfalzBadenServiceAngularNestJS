import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, calendarOutline, timerOutline } from 'ionicons/icons';

@Component({
  selector: 'app-mobile-shell',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    IonTabs,
    IonRouterOutlet,
    IonTabBar,
    IonTabButton,
    IonLabel,
    IonIcon,
  ],
  templateUrl: './mobile-shell.component.html',
  styleUrl: './mobile-shell.component.scss',
})
export class MobileShellComponent {
  constructor() {
    addIcons({ timerOutline, calendarOutline, cameraOutline });
  }
}
