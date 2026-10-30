import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Session } from './services/session';

/** Pantallas que requieren sesión iniciada. */
export const authGuard: CanActivateFn = () => {
  const session = inject(Session);
  return session.isLoggedIn() || inject(Router).parseUrl(session.onboarded() ? '/ingresar' : '/');
};

/** Pantallas de entrada: si ya hay sesión, ir al inicio. */
export const guestGuard: CanActivateFn = () => inject(Session).isLoggedIn() ? inject(Router).parseUrl('/familia') : true;
