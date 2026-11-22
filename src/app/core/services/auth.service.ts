import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse, RegistroRequest, Rol, UsuarioRegistrado } from '../interfaces/auth.interface';

//Adaptado del AuthService del profesor (frontend_lp2)
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  //usamos la ruta del BACKEND
  private apiUrl = '/api/v1/auth';

  //el backend nuevo ya tiene POST /api/v1/auth/login
  readonly loginDisponible = true;

  //nombre del usuario en sesion (para el header y el sidebar)
  usuario = signal<string | null>(localStorage.getItem('usuario_vimalu'));

  //registro de clientes
  registrar(datos: RegistroRequest):Observable<UsuarioRegistrado>{
    return this.http.post<UsuarioRegistrado>(`${this.apiUrl}/registro`, datos);
  }

  //login real: guarda la respuesta del backend y redirige segun el rol
  login(credenciales: LoginRequest):Observable<LoginResponse>{
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credenciales).pipe(
      tap(respuesta =>{
        this.guardarSesion(respuesta);
        this.router.navigate([this.rutaSegunRol(respuesta.rol)]);
      })
    );
  }

  //solo se guardan los datos que devuelve el backend; nunca la contraseña
  private guardarSesion(respuesta: LoginResponse){
    localStorage.setItem('token_vimalu', respuesta.token);
    localStorage.setItem('usuario_vimalu', respuesta.usuario);
    localStorage.setItem('rol_vimalu', respuesta.rol);
    localStorage.setItem('persona_vimalu', String(respuesta.idPersona));
    this.usuario.set(respuesta.usuario);
  }

  //redireccion despues del login: ADMIN al Dashboard y CLIENTE a la bienvenida
  rutaSegunRol(rol: Rol | null){
    return rol === 'ADMIN' ? '/' : '/inicio';
  }

  getToken(){
    return localStorage.getItem('token_vimalu');
  }

  getRol(){
    return localStorage.getItem('rol_vimalu') as Rol | null;
  }

  getIdPersona(){
    const id = localStorage.getItem('persona_vimalu');
    return id ? Number(id) : null;
  }

  //la sesion es valida si hay token y todavia no vence (campo "exp" del JWT, en segundos)
  estaLogueado(){
    const token = this.getToken();
    if(!token) return false;
    try {
      const datos = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return !datos.exp || datos.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  //borra la sesion; si se pasa un motivo se muestra en el login
  cerrarSesion(){
    ['token_vimalu', 'usuario_vimalu', 'rol_vimalu', 'persona_vimalu'].forEach(clave => localStorage.removeItem(clave));
    this.usuario.set(null);
  }

  logout(){
    this.cerrarSesion();
    this.router.navigate(['/login']);
  }
}
