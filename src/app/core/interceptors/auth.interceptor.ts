import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AlertService } from '../service/alert.service';

//Adaptado del interceptor del profesor (frontend_lp2)
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const alertService = inject(AlertService);
  const router = inject(Router);
  const esLogin = req.url.includes('/api/v1/auth/');

  //1. agrega el token a las peticiones del backend (no al login ni al registro)
  const token = authService.getToken();
  const peticion = token && !esLogin && req.url.startsWith('/api')
    ? req.clone({setHeaders: {Authorization: `Bearer ${token}`}})
    : req;

  return next(peticion).pipe(
    catchError((error: HttpErrorResponse) => {
      //2. sesion vencida o token invalido: se cierra la sesion y se vuelve al login
      if(error.status === 401 && !esLogin){
        authService.cerrarSesion();
        alertService.toast('Tu sesión expiró. Inicia sesión nuevamente', 'info');
        router.navigate(['/login']);
      }
      //3. el backend responde {mensaje}, {message} o {errors: {...}}: se deja todo en "mensaje"
      //   para que los componentes existentes sigan leyendo err.error?.mensaje
      const cuerpo = error.error && typeof error.error === 'object' ? error.error : {};
      const mensaje = cuerpo.mensaje ?? cuerpo.message
        ?? (cuerpo.errors ? Object.values(cuerpo.errors)[0] : undefined);
      return throwError(() => new HttpErrorResponse({
        error: mensaje ? {...cuerpo, mensaje} : error.error,
        headers: error.headers,
        status: error.status,
        statusText: error.statusText,
        url: error.url ?? undefined
      }));
    })
  );
};
