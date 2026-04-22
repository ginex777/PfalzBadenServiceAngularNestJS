import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, calendarOutline, timerOutline } from 'ionicons/icons';
import { MobileAuthService } from '../core/auth.service';

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
  private readonly auth = inject(MobileAuthService);

  protected readonly showOperativeTabs = computed(() => {
    const role = this.auth.currentUser()?.rolle;
    return role === 'admin' || role === 'mitarbeiter';
  });

  constructor() {
    addIcons({ timerOutline, calendarOutline, cameraOutline });
  }
}
