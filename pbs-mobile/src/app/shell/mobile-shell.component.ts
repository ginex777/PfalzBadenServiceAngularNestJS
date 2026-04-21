import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, calendarOutline, timerOutline } from 'ionicons/icons';

@Component({
  selector: 'app-mobile-shell',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
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
