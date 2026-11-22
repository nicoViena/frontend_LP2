import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../../core/service/alert.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);

  loginDisponible = this.authService.loginDisponible;
  cargando = false;
  form: FormGroup = this.fb.group({
    usuario: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  constructor(){
    //si ya hay una sesion valida, se va directo a su pagina de inicio
    if(this.authService.estaLogueado()){
      inject(Router).navigate([this.authService.rutaSegunRol(this.authService.getRol())]);
    }
  }

  iniciarSesion(){
    if(this.form.invalid){
      this.form.markAllAsTouched();
      return;
    }
    //sin endpoint de login no se crea ninguna sesion
    if(!this.loginDisponible){
      this.alertService.error('El inicio de sesión estará disponible cuando el backend implemente el login.', 'Función pendiente');
      return;
    }
    this.cargando = true;
    this.authService.login(this.form.value).subscribe({
      next:()=>{
        this.cargando = false;
        this.alertService.toast('Bienvenido');
      },
      error:(err)=>{
        this.cargando = false;
        //401: credenciales incorrectas; si el backend esta apagado no hay respuesta (status 0)
        if(err.status === 0 || err.status >= 500){
          this.alertService.error('No se pudo conectar con el servidor');
        } else {
          this.alertService.error(err.error?.mensaje ?? 'Usuario o contraseña incorrectos');
        }
      }
    });
  }
}
