import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  const isAuthEndpoint = req.url.includes('/api/auth/');
  
  const authReq = req.clone(
    token && !isAuthEndpoint
      ? {
          setHeaders: { Authorization: `Bearer ${token}` }
        }
      : {}
  );

  return next(authReq);
};
