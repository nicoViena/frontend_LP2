import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SalonService } from '../../../core/services/salon.service';
import { MesaService } from '../../../core/services/mesa.service';
import { AlertService } from '../../../core/service/alert.service';
import { Mesa } from '../../../core/interfaces/mesa.interface';

@Component({
  selector: 'app-salon-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './salon-form.component.html',
  styleUrl: './salon-form.component.css'
})
export class SalonFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private salonService = inject(SalonService);
  private mesaService = inject(MesaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private alertService = inject(AlertService);

  form: FormGroup;
  id:number | null = null;
  mesas: Mesa[] = [];
  //datos del salon antes de editar: sus mesas cuentan como disponibles si no cambia de tipo
  idMesaOriginal: number | null = null;
  cantidadOriginal = 0;

  constructor(){
    this.form = this.fb.group({
      nombre : ['', [Validators.required, Validators.maxLength(20)]],
      idMesa : [null, [Validators.required]],
      cantidad: [1, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
      estado: ['DISPONIBLE', [Validators.required]]
    })
  }

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.mesaService.getMesas().subscribe({
      next:(data)=>{
        this.mesas = data;
        this.actualizarMaximo();
      },
      error:()=> this.alertService.error('No se pudieron cargar los tipos de mesa')
    });
    if(this.id){
      this.salonService.getSalonById(this.id).subscribe(s =>{
        this.idMesaOriginal = s.idMesa;
        this.cantidadOriginal = s.cantidad;
        this.form.patchValue(s);
        this.actualizarMaximo();
      })
    }
    this.form.get('idMesa')?.valueChanges.subscribe(()=> this.actualizarMaximo());
  }

  mesaSeleccionada(){
    //se lee el control: form.value aun no se actualiza dentro de valueChanges
    const idMesa = this.form.get('idMesa')?.value;
    return this.mesas.find(m => m.idMesa === idMesa);
  }

  //misma regla del backend: mesas libres del tipo, mas las que ya tiene el salon si no cambia de tipo
  disponibles(mesa: Mesa){
    return mesa.cantidad + (mesa.idMesa === this.idMesaOriginal ? this.cantidadOriginal : 0);
  }

  actualizarMaximo(){
    const mesa = this.mesaSeleccionada();
    const cantidad = this.form.get('cantidad');
    const validadores = [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)];
    if(mesa) validadores.push(Validators.max(this.disponibles(mesa)));
    cantidad?.setValidators(validadores);
    cantidad?.updateValueAndValidity();
  }

  capacidadTotal(){
    const mesa = this.mesaSeleccionada();
    const cantidad = Number(this.form.value.cantidad);
    //calculo capacidad total
    return mesa && cantidad > 0 ? mesa.capacidad * cantidad : 0;
  }

  guardar(){
    if(this.form.invalid) return;
    const salon = this.form.value;
    const request = this.id
    ? this.salonService.actualizarSalon(this.id, salon)
    : this.salonService.crearSalon(salon)
    request.subscribe({
      next:() =>{
        this.alertService.success(this.id ? 'Salón Actualizado':'Salón Creado');
        this.router.navigate(['/salones']);
      }, error:(err)=> this.alertService.error(err.error?.mensaje ?? 'Ocurrio un error al guardar')
    })
  }
}
