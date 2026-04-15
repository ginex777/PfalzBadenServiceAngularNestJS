import { Component, signal, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NutzerService } from '../../core/services/nutzer.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly nutzerService = inject(NutzerService);

  email = signal('');
  password = signal('');
  fehler = signal('');
  laedt = signal(false);
  setupModus = signal(false);
  sessionAbgelaufen = signal(false);

  ngOnInit() {
    this.route.queryParams.subscribe(p => {
      if (p['reason'] === 'session') this.sessionAbgelaufen.set(true);
    });
    // Check first-run
    this.auth.checkSetupRequired().subscribe({
      next: res => this.setupModus.set(res.setupRequired),
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

    action$.subscribe({
      next: () => {
        if (this.setupModus()) {
          this.auth.login(this.email(), this.password()).subscribe({
            next: () => { this._autoSetNutzer(); this._redirect(); },
            error: () => this._redirect(),
          });
        } else {
          this._autoSetNutzer();
          this._redirect();
        }
      },
      error: (err) => {
        this.laedt.set(false);
        const msg = err?.error?.message;
        this.fehler.set(msg ?? 'Anmeldung fehlgeschlagen.');
      },
    });
  }

  private _autoSetNutzer(): void {
    const user = this.auth.currentUser();
    if (user) {
      const name = user.vorname && user.nachname
        ? `${user.vorname} ${user.nachname}`
        : user.vorname || user.nachname || user.email;
      this.nutzerService.setzen(name);
    }
  }

  private _redirect() {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
    this.router.navigateByUrl(returnUrl);
  }
}
