import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SalonNuevo } from '../../../core/interfaces/salon-mesa.interface';
import { SalonService } from '../../../core/services/salon.service';
import { AlertService } from '../../../core/service/alert.service';

//Modal para agregar (salon = null) o editar un salon
@Component({
  selector: 'app-salon-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './salon-form.component.html',
  styleUrl: './salon-form.component.css'
})
export class SalonFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private salonService = inject(SalonService);
  private alertService = inject(AlertService);

  @Input() salon: SalonNuevo | null = null;
  @Output() cerrar = new EventEmitter<void>();
  @Output() guardado = new EventEmitter<void>();

  guardando = false;
  //cantidadMesas no va en el formulario: el backend la calcula contando las mesas del salon
  form: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(50)]],
    estado: ['DISPONIBLE', [Validators.required]]
  });

  ngOnInit(): void {
    if(this.salon) this.form.patchValue(this.salon);
  }

  //POST /api/salones al registrar, PUT /api/salones/{id} al editar
  guardar(){
    if(this.form.invalid){
      this.form.markAllAsTouched();
      return;
    }
    const datos: SalonNuevo = this.form.value;
    const peticion = this.salon
      ? this.salonService.actualizarSalon(this.salon.idSalon!, datos)
      : this.salonService.crearSalon(datos);
    this.guardando = true;
    peticion.subscribe({
      next:()=>{
        this.guardando = false;
        this.alertService.toast(this.salon ? 'Salón actualizado' : 'Salón registrado');
        this.guardado.emit();
      },
      error:(err)=>{
        this.guardando = false;
        this.alertService.error(err.error?.mensaje ?? 'No se pudo guardar el salón');
      }
    });
  }
}
