import { Component, DestroyRef, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IonButton, IonContent, IonToast } from '@ionic/angular/standalone';
import { getApiErrorBody } from '../../core/api-error';
import { MobileAuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  host: { class: 'ion-page' },
  imports: [ReactiveFormsModule, IonButton, IonContent, IonToast],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private readonly auth = inject(MobileAuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  toastMessage = signal('');
  toastOpen = signal(false);
  isLoading = signal(false);

  login() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showToast('Bitte E-Mail und Passwort eingeben.');
      return;
    }
    this.isLoading.set(true);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email ?? '', password ?? '').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.router.navigate(['/tabs/heute']),
      error: (err) => {
        this.isLoading.set(false);
        this.showToast(this.resolveLoginErrorMessage(err));
      },
    });
  }

  protected closeToast(): void {
    this.toastOpen.set(false);
  }

  protected showFieldError(controlName: 'email' | 'password'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  private resolveLoginErrorMessage(error: unknown): string {
    const apiError = getApiErrorBody(error);
    if (apiError?.code === 'MISSING_EMPLOYEE_MAPPING') {
      return 'Dein Benutzer ist noch keinem Mitarbeiterprofil zugeordnet. Bitte Admin kontaktieren.';
    }
    if (apiError?.statusCode === 401) {
      return 'E-Mail oder Passwort sind nicht korrekt.';
    }
    return apiError?.message ?? 'Anmeldung fehlgeschlagen. Bitte erneut versuchen.';
  }

  private showToast(message: string): void {
    this.toastMessage.set(message);
    this.toastOpen.set(true);
  }
}
