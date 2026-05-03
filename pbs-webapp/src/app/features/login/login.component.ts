import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, DestroyRef, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { getApiErrorMessage } from '../../core/api-error';
import { AuthService } from '../../core/services/auth.service';
import { NutzerService } from '../../core/services/nutzer.service';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly nutzerService = inject(NutzerService);

  email = signal('');
  password = signal('');
  fehler = signal('');
  laedt = signal(false);
  setupModus = signal(false);
  sessionAbgelaufen = signal(false);

  ngOnInit() {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((p) => {
      if (p['reason'] === 'session') this.sessionAbgelaufen.set(true);
    });
    // Check first-run
    this.auth.checkSetupRequired().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => this.setupModus.set(res.setupRequired),
      error: () => {},
    });
  }

  submit() {
    if (!this.email() || !this.password()) {
      this.fehler.set('Bitte E-Mail und Passwort eingeben.');
      return;
    }
    this.fehler.set('');
    this.laedt.set(true);

    const action$ = this.setupModus()
      ? this.auth.setup(this.email(), this.password())
      : this.auth.login(this.email(), this.password());

    action$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        if (this.setupModus()) {
          this.auth.login(this.email(), this.password()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
              this._autoSetNutzer();
              this._redirect();
            },
            error: () => this._redirect(),
          });
        } else {
          this._autoSetNutzer();
          this._redirect();
        }
      },
      error: (err) => {
        this.laedt.set(false);
        this.fehler.set(getApiErrorMessage(err) ?? 'Anmeldung fehlgeschlagen.');
      },
    });
  }

  private _autoSetNutzer(): void {
    const user = this.auth.currentUser();
    if (user) {
      const name =
        user.vorname && user.nachname
          ? `${user.vorname} ${user.nachname}`
          : user.vorname || user.nachname || user.email;
      this.nutzerService.setzen(name);
    }
  }

  private _redirect() {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/uebersicht';
    this.router.navigateByUrl(returnUrl);
  }
}
