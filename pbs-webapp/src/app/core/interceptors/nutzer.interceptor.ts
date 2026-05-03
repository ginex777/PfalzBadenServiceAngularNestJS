import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { NutzerService } from '../services/nutzer.service';

export const nutzerInterceptor: HttpInterceptorFn = (req, next) => {
  const nutzer = inject(NutzerService).aktiverNutzer();
  if (!nutzer) return next(req);
  return next(req.clone({ setHeaders: { 'X-Nutzer': nutzer } }));
};
