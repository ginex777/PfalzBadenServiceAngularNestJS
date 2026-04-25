import { Component, computed, inject } from '@angular/core';
import { IonBadge, IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, calendarOutline, listOutline, timerOutline, trashOutline } from 'ionicons/icons';
import { MobileAuthService } from '../core/auth.service';
import { TimerStateService } from '../core/timer-state.service';

@Component({
  selector: 'app-mobile-shell',
  standalone: true,
  host: { class: 'ion-page' },
  imports: [IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel, IonBadge],
  templateUrl: './mobile-shell.component.html',
  styleUrl: './mobile-shell.component.scss',
})
export class MobileShellComponent {
  private readonly auth = inject(MobileAuthService);
  private readonly timerState = inject(TimerStateService);

  protected readonly showOperativeTabs = computed(() => {
    const role = this.auth.currentUser()?.rolle;
    return role === 'admin' || role === 'mitarbeiter';
  });

  protected readonly isTimerActive = computed(() => this.timerState.isActive());
  protected readonly timerRuntime = computed(() => this.timerState.runtime());

  constructor() {
    addIcons({ timerOutline, calendarOutline, cameraOutline, trashOutline, listOutline });
  }
}
