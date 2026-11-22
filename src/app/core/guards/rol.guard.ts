import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Rol } from '../interfaces/auth.interface';

//Permite entrar solo si hay sesion valida y el rol esta en la lista.
//Uso en las rutas: canActivate: [rolGuard(['ADMIN'])]
export const rolGuard = (roles: Rol[]): CanActivateFn => () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  //sin sesion o con el token vencido: al login
  if(!authService.estaLogueado()){
    authService.cerrarSesion();
    return router.createUrlTree(['/login']);
  }
  //con otro rol: a su propia pagina de inicio
  const rol = authService.getRol();
  if(!rol || !roles.includes(rol)){
    return router.createUrlTree([authService.rutaSegunRol(rol)]);
  }
  return true;
};
