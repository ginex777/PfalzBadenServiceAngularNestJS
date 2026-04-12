import { Component, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MobileAuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private readonly auth = inject(MobileAuthService);
  private readonly router = inject(Router);

  form = new FormGroup({
    email:    new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  fehler = signal('');
  laedt  = signal(false);

  login() {
    if (this.form.invalid) {
      this.fehler.set('Bitte E-Mail und Passwort eingeben.');
      return;
    }
    this.fehler.set('');
    this.laedt.set(true);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email!, password!).subscribe({
      next: () => this.router.navigate(['/stempeluhr']),
      error: (err) => {
        this.laedt.set(false);
        this.fehler.set(err?.error?.message ?? 'Anmeldung fehlgeschlagen.');
      },
    });
  }
}
