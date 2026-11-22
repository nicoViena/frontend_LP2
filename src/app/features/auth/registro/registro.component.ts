import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../../core/service/alert.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private router = inject(Router);

  cargando = false;
  //mismas validaciones que RegistroDTO del backend
  form: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    telefono: ['', [Validators.required, Validators.pattern(/^9\d{8}$/)]],
    usuario: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(20)]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  invalido(campo: string){
    const control = this.form.get(campo);
    return !!control && control.touched && control.invalid;
  }

  registrar(){
    if(this.form.invalid){
      this.form.markAllAsTouched();
      return;
    }
    this.cargando = true;
    this.authService.registrar(this.form.value).subscribe({
      next:()=>{
        this.cargando = false;
        this.alertService.success('Tu cuenta de cliente fue creada', '¡Registro exitoso!');
        this.router.navigate(['/login']);
      },
      error:(err)=>{
        this.cargando = false;
        //el backend responde 409 si el email, el DNI o el usuario ya existen
        if(err.error?.mensaje){
          this.alertService.error(err.error.mensaje);
        } else if(err.status === 409){
          this.alertService.error('El email, el DNI o el usuario ya están registrados');
        } else if(err.status === 400){
          this.alertService.error('Revisa los datos del formulario');
        } else {
          this.alertService.error('No se pudo completar el registro');
        }
      }
    });
  }
}
