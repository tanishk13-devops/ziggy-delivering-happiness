import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getCurrentUser();
  if (authService.isLoggedIn() && user && user.role === 'Admin') {
    return true;
  }

  // Redirect to home page if not authorized
  router.navigate(['/home']);
  return false;
};
