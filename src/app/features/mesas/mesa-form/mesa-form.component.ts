import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MesaService } from '../../../core/services/mesa.service';
import { SalonService } from '../../../core/services/salon.service';
import { AlertService } from '../../../core/service/alert.service';

@Component({
  selector: 'app-mesa-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './mesa-form.component.html',
  styleUrl: './mesa-form.component.css'
})
export class MesaFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private mesaService = inject(MesaService);
  private salonService = inject(SalonService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private alertService = inject(AlertService);

  form: FormGroup;
  id:number | null = null;
  salonesAsignados: string[] = [];

  constructor(){
    this.form = this.fb.group({
      nombre : ['', [Validators.required, Validators.maxLength(50)]],
      capacidad: [1, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
      cantidad: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]]
    })
  }

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    if(this.id){
      this.mesaService.getMesaById(this.id).subscribe(m =>{
        this.form.patchValue(m)
      })
      //misma regla del backend: no se cambia la capacidad de una mesa ya asignada a salones
      this.salonService.getSalones().subscribe(salones =>{
        this.salonesAsignados = salones.filter(s => s.idMesa === this.id).map(s => s.nombre);
        if(this.salonesAsignados.length > 0){
          this.form.get('capacidad')?.disable();
        }
      })
    }
  }

  guardar(){
    if(this.form.invalid) return;
    //getRawValue incluye la capacidad aunque el campo este bloqueado
    const mesa = this.form.getRawValue();
    const request = this.id
    ? this.mesaService.actualizarMesa(this.id, mesa)
    : this.mesaService.crearMesa(mesa)
    request.subscribe({
      next:() =>{
        this.alertService.success(this.id ? 'Mesa Actualizada':'Mesa Creada');
        this.router.navigate(['/mesas']);
      }, error:(err)=> this.alertService.error(err.error?.mensaje ?? 'Ocurrio un error al guardar')
    })
  }
}
