import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MesaNueva, SalonNuevo } from '../../../core/interfaces/salon-mesa.interface';
import { MesaService } from '../../../core/services/mesa.service';
import { AlertService } from '../../../core/service/alert.service';

//Modal para agregar (mesa = null) o editar una mesa
@Component({
  selector: 'app-mesa-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mesa-form.component.html',
  styleUrl: './mesa-form.component.css'
})
export class MesaFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private mesaService = inject(MesaService);
  private alertService = inject(AlertService);

  @Input() mesa: MesaNueva | null = null;
  //salones para el desplegable (cada mesa pertenece a un solo salon)
  @Input() salones: SalonNuevo[] = [];
  @Output() cerrar = new EventEmitter<void>();
  @Output() guardado = new EventEmitter<void>();

  guardando = false;
  form: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(50)]],
    capacidad: [1, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
    idSalon: [null as number | null, [Validators.required]]
  });

  ngOnInit(): void {
    if(this.mesa) this.form.patchValue(this.mesa);
  }

  //POST /api/mesas al registrar, PUT /api/mesas/{id} al editar
  guardar(){
    if(this.form.invalid){
      this.form.markAllAsTouched();
      return;
    }
    const datos: MesaNueva = this.form.value;
    const peticion = this.mesa
      ? this.mesaService.actualizarMesa(this.mesa.idMesa!, datos)
      : this.mesaService.crearMesa(datos);
    this.guardando = true;
    peticion.subscribe({
      next:()=>{
        this.guardando = false;
        this.alertService.toast(this.mesa ? 'Mesa actualizada' : 'Mesa registrada');
        this.guardado.emit();
      },
      error:(err)=>{
        this.guardando = false;
        this.alertService.error(err.error?.mensaje ?? 'No se pudo guardar la mesa');
      }
    });
  }
}
