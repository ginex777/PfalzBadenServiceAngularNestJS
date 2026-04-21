import { Component, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonInput, IonItem, IonLabel, IonText } from '@ionic/angular/standalone';
import { MobileAuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, IonContent, IonItem, IonLabel, IonInput, IonButton, IonText],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private readonly auth = inject(MobileAuthService);
  private readonly router = inject(Router);

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  errorMessage = signal('');
  isLoading = signal(false);

  login() {
    if (this.form.invalid) {
      this.errorMessage.set('Bitte E-Mail und Passwort eingeben.');
      return;
    }
    this.errorMessage.set('');
    this.isLoading.set(true);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email!, password!).subscribe({
      next: () => this.router.navigate(['/tabs/heute']),
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Anmeldung fehlgeschlagen.');
      },
    });
  }
}
