import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { ReservaService } from '../../../core/services/reserva.service';
import { SalonService } from '../../../core/services/salon.service';
import { MesaService } from '../../../core/services/mesa.service';
import { AlertService } from '../../../core/service/alert.service';
import { ReservaMesaDTO } from '../../../core/interfaces/reserva.interface';
import { MesaNueva, SalonNuevo } from '../../../core/interfaces/salon-mesa.interface';

@Component({
  selector: 'app-reserva-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reserva-form.component.html',
  styleUrl: './reserva-form.component.css'
})
export class ReservaFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private reservaService = inject(ReservaService);
  private salonService = inject(SalonService);
  private mesaService = inject(MesaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private alertService = inject(AlertService);

  form: FormGroup;
  id:number | null = null;
  reserva: ReservaMesaDTO | null = null;
  salones: SalonNuevo[] = [];
  //mesas del salon elegido, con su disponibilidad para la fecha
  mesas: MesaNueva[] = [];
  estados = ['PENDIENTE', 'CONFIRMADO', 'RECHAZADO', 'TERMINADO'];

  constructor(){
    //mismas validaciones que ReservaDTO y SolicitudReservaDTO del backend
    //idSalon no se envia: solo sirve para filtrar las mesas
    this.form = this.fb.group({
      idPersona: [null, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
      idSalon: [null as number | null, [Validators.required]],
      idMesa: [null as number | null, [Validators.required]],
      fechaReserva: ['', [Validators.required]],
      horaReserva: ['', [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):[0-5]\d$/)]],
      cantidadPersonas: [1, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
      motivo: ['', [Validators.maxLength(100)]],
      estadoReserva: ['PENDIENTE', [Validators.required]]
    })
  }

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.salonService.listarSalones().subscribe({
      next:(data)=> this.salones = data,
      error:()=> this.alertService.error('No se pudieron cargar los salones')
    });
    //al cambiar el salon o la fecha se vuelven a consultar las mesas
    this.form.get('idSalon')?.valueChanges.subscribe(()=> this.cargarMesas());
    this.form.get('fechaReserva')?.valueChanges.subscribe(()=> this.cargarMesas());
    this.form.get('idMesa')?.valueChanges.subscribe(()=> this.actualizarMaximo());
    this.form.get('estadoReserva')?.valueChanges.subscribe(()=> this.actualizarMaximo());

    if(this.id){
      this.reservaService.getReservaById(this.id).subscribe(r =>{
        this.reserva = r;
        this.form.patchValue(r);
        //la reserva solo trae idMesa: se busca su mesa para saber a que salon pertenece
        this.mesaService.listarMesas().subscribe(todas =>{
          const mesa = todas.find(m => m.idMesa === r.idMesa);
          if(mesa) this.form.get('idSalon')?.setValue(mesa.idSalon);
        });
      })
    }
  }

  //GET /api/mesas?idSalon=&fecha=
  cargarMesas(){
    const idSalon = this.form.get('idSalon')?.value;
    const fecha = this.form.get('fechaReserva')?.value;
    if(!idSalon){
      this.mesas = [];
      return;
    }
    this.mesaService.listarMesas(idSalon, fecha || undefined).subscribe({
      next:(data)=>{
        this.mesas = data;
        //si la mesa elegida ya no pertenece al salon o quedo ocupada, se limpia
        const elegida = this.mesas.find(m => m.idMesa === this.form.get('idMesa')?.value);
        if(!elegida || this.mesaBloqueada(elegida)) this.form.get('idMesa')?.setValue(null);
        this.actualizarMaximo();
      },
      error:()=> this.alertService.error('No se pudieron cargar las mesas')
    });
  }

  //misma regla del backend: solo las reservas PENDIENTE o CONFIRMADO validan mesa y capacidad
  estadoActivo(){
    const estado = this.form.get('estadoReserva')?.value;
    return estado === 'PENDIENTE' || estado === 'CONFIRMADO';
  }

  //la mesa que la reserva ya tenia en esa misma fecha no cuenta como ocupada
  esMesaPropia(m: MesaNueva){
    return !!this.reserva && m.idMesa === this.reserva.idMesa
      && this.form.get('fechaReserva')?.value === this.reserva.fechaReserva;
  }

  mesaBloqueada(m: MesaNueva){
    return this.estadoActivo() && !m.disponible && !this.esMesaPropia(m);
  }

  mesaSeleccionada(){
    return this.mesas.find(m => m.idMesa === this.form.get('idMesa')?.value) ?? null;
  }

  //la cantidad de personas no puede superar la capacidad de la mesa elegida
  actualizarMaximo(){
    const personas = this.form.get('cantidadPersonas');
    const capacidad = this.mesaSeleccionada()?.capacidad;
    const validadores = [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)];
    if(capacidad && this.estadoActivo()) validadores.push(Validators.max(capacidad));
    personas?.setValidators(validadores);
    personas?.updateValueAndValidity({emitEvent: false});
  }

  guardar(){
    if(this.form.invalid){
      this.form.markAllAsTouched();
      return;
    }
    const datos = this.form.value;
    //al editar se envia ReservaDTO; al registrar, SolicitudReservaDTO (sin productos)
    const request: Observable<unknown> = this.id
    ? this.reservaService.actualizarReserva(this.id, {
        idReserva: this.id,
        idPersona: datos.idPersona,
        idMesa: datos.idMesa,
        fechaReserva: datos.fechaReserva,
        horaReserva: datos.horaReserva,
        cantidadPersonas: datos.cantidadPersonas,
        motivo: datos.motivo,
        estadoReserva: datos.estadoReserva
      })
    : this.reservaService.crearReserva({
        idPersona: datos.idPersona,
        idMesa: datos.idMesa,
        fechaReserva: datos.fechaReserva,
        horaReserva: datos.horaReserva,
        cantidadPersonas: datos.cantidadPersonas,
        motivo: datos.motivo,
        items: []
      })
    request.subscribe({
      next:() =>{
        this.alertService.success(this.id ? 'Reserva Actualizada':'Reserva Registrada');
        this.router.navigate(['/reservas']);
      }, error:(err)=> {
        if(err.error?.mensaje){
          this.alertService.error(err.error.mensaje);
        } else if(err.status === 404){
          this.alertService.error('No existe la persona o la mesa indicada');
        } else {
          this.alertService.error('Ocurrio un error al guardar');
        }
      }
    })
  }
}
