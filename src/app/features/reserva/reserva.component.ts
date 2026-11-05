import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SalonService } from '../../core/services/salon.service';
import { MesaService } from '../../core/services/mesa.service';
import { CartService } from '../../core/services/cart.service';
import { AlertService } from '../../core/service/alert.service';
import { Salon } from '../../core/interfaces/salon.interface';

interface DiaCalendario{
  fecha: string;
  dia: number;
}

@Component({
  selector: 'app-reserva',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reserva.component.html',
  styleUrl: './reserva.component.css'
})
export class ReservaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private salonService = inject(SalonService);
  private mesaService = inject(MesaService);
  private cartService = inject(CartService);
  private alertService = inject(AlertService);
  private router = inject(Router);

  form: FormGroup;
  salones: Salon[] = [];
  salonSeleccionado: Salon | null = null;
  capacidadMesa: number | null = null;

  //calendario del mes visible
  nombresDias = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
  mesActual = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  dias: (DiaCalendario | null)[] = [];
  //mesas libres por fecha, segun el backend
  disponibilidad: Record<string, number> = {};
  hoy = this.formatearFecha(new Date());
  //horario de atencion: 10:00 a 17:00 cada 30 minutos (formato HH:mm del backend)
  horas = this.generarHoras(10, 17, 30);

  constructor(){
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      cantPersonas: [1, [Validators.required, Validators.min(1)]],
      idSalon: [null, [Validators.required]],
      fechaReserva: ['', [Validators.required, this.fechaNoLunes]],
      horaReserva: ['', [Validators.required, this.horaPermitida]]
    })
  }

  ngOnInit(): void {
    //si vuelve a editar, recupera la reserva guardada
    const reserva = this.cartService.getReserva();
    if(reserva){
      this.form.patchValue(reserva);
      //una fecha lunes guardada antes ya no es valida
      if(this.esLunes(reserva.fechaReserva)){
        this.form.patchValue({fechaReserva: ''});
        this.alertService.toast('Los lunes no hay atención. Elige otra fecha', 'info');
      }
      const [anio, mes] = reserva.fechaReserva.split('-').map(Number);
      const mesGuardado = new Date(anio, mes - 1, 1);
      if(mesGuardado > this.mesActual) this.mesActual = mesGuardado;
    }
    this.generarDias();
    this.salonService.getSalones().subscribe({
      next:(data)=>{
        this.salones = data;
        if(reserva) this.seleccionarSalon(reserva.idSalon);
      },
      error:()=> this.alertService.error('No se pudieron cargar los salones')
    });
    this.form.get('idSalon')?.valueChanges.subscribe(id => this.seleccionarSalon(id));
  }

  seleccionarSalon(id: number){
    this.salonSeleccionado = this.salones.find(s => s.idSalon === id) ?? null;
    this.capacidadMesa = null;
    this.disponibilidad = {};
    if(!this.salonSeleccionado) return;
    //cada salon tiene su propio tipo de mesa y capacidad
    this.mesaService.getMesaById(this.salonSeleccionado.idMesa).subscribe({
      next:(mesa)=>{
        this.capacidadMesa = mesa.capacidad;
        const personas = this.form.get('cantPersonas');
        personas?.setValidators([Validators.required, Validators.min(1), Validators.max(mesa.capacidad)]);
        personas?.updateValueAndValidity();
      },
      error:()=> this.alertService.error('No se pudo consultar la capacidad de las mesas')
    });
    this.cargarDisponibilidad();
  }

  cargarDisponibilidad(){
    const salon = this.salonSeleccionado;
    if(!salon) return;
    const fechas = this.dias
      .filter((d): d is DiaCalendario => d !== null && d.fecha >= this.hoy && !this.esLunes(d.fecha))
      .map(d => d.fecha);
    if(fechas.length === 0) return;
    this.salonService.getDisponibilidadFechas(salon.idSalon, fechas).subscribe({
      next:(resultado)=>{
        //ignora respuestas de un salon que ya no esta seleccionado
        if(this.salonSeleccionado?.idSalon !== salon.idSalon) return;
        resultado.forEach(s =>{
          if(s.fecha) this.disponibilidad[s.fecha] = s.mesasDisponibles ?? 0;
        });
        const fecha = this.form.value.fechaReserva;
        if(fecha && this.disponibilidad[fecha] !== undefined && this.disponibilidad[fecha] < 1){
          this.form.patchValue({fechaReserva: ''});
          this.alertService.toast('La fecha elegida ya no está disponible en este salón', 'info');
        }
      },
      error:()=> this.alertService.error('No se pudo consultar la disponibilidad del salón')
    });
  }

  generarDias(){
    const anio = this.mesActual.getFullYear();
    const mes = this.mesActual.getMonth();
    //la semana empieza el lunes
    const espacios = (new Date(anio, mes, 1).getDay() + 6) % 7;
    const totalDias = new Date(anio, mes + 1, 0).getDate();
    this.dias = [];
    for(let i = 0; i < espacios; i++) this.dias.push(null);
    for(let d = 1; d <= totalDias; d++){
      this.dias.push({fecha: this.formatearFecha(new Date(anio, mes, d)), dia: d});
    }
  }

  cambiarMes(delta: number){
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + delta, 1);
    this.generarDias();
    this.cargarDisponibilidad();
  }

  puedeRetroceder(){
    const hoy = new Date();
    return this.mesActual > new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  }

  tituloMes(){
    return this.mesActual.toLocaleDateString('es-PE', {month: 'long', year: 'numeric'});
  }

  estadoDia(dia: DiaCalendario){
    if(dia.fecha < this.hoy) return 'pasado';
    if(this.esLunes(dia.fecha)) return 'lunes';
    if(!this.salonSeleccionado) return 'sin-salon';
    const mesas = this.disponibilidad[dia.fecha];
    if(mesas === undefined) return 'cargando';
    return mesas > 0 ? 'disponible' : 'no-disponible';
  }

  claseDia(dia: DiaCalendario){
    if(dia.fecha === this.form.value.fechaReserva && !this.esLunes(dia.fecha)) return 'btn-success';
    switch(this.estadoDia(dia)){
      case 'disponible': return 'btn-outline-success';
      case 'no-disponible': return 'btn-outline-danger';
      default: return 'btn-light text-muted';
    }
  }

  seleccionarFecha(dia: DiaCalendario){
    if(this.estadoDia(dia) !== 'disponible') return;
    this.form.patchValue({fechaReserva: dia.fecha});
    this.form.get('fechaReserva')?.markAsTouched();
  }

  seleccionarHora(hora: string){
    this.form.patchValue({horaReserva: hora});
    this.form.get('horaReserva')?.markAsTouched();
  }

  siguiente(){
    if(this.form.get('cantPersonas')?.errors?.['max']){
      this.alertService.error(`Para reservar para más de ${this.capacidadMesa} personas, comuníquese con un administrador`);
      return;
    }
    if(this.form.get('horaReserva')?.errors?.['horaNoPermitida']){
      this.alertService.error('Elige una hora entre 10:00 y 17:00, en intervalos de 30 minutos');
      return;
    }
    if(this.form.get('fechaReserva')?.errors?.['lunes']){
      this.alertService.error('Los lunes no hay atención. Elige otra fecha');
      return;
    }
    if(this.form.invalid){
      this.form.markAllAsTouched();
      this.alertService.error('Completa correctamente los datos de la reserva');
      return;
    }
    const salon = this.salonSeleccionado;
    if(!salon || this.capacidadMesa === null) return;
    const datos = this.form.value;
    if(salon.estado !== 'DISPONIBLE'){
      this.alertService.error('El salón no está disponible');
      return;
    }
    //misma regla del backend: no se reserva para mas personas que la capacidad de la mesa
    if(datos.cantPersonas > this.capacidadMesa){
      this.alertService.error(`Para reservar para más de ${this.capacidadMesa} personas, comuníquese con un administrador`);
      return;
    }
    //se confirma con el backend que la fecha sigue disponible
    this.salonService.getDisponibilidad(salon.idSalon, datos.fechaReserva).subscribe({
      next:(s)=>{
        if((s.mesasDisponibles ?? 0) < 1){
          this.alertService.error('No quedan mesas disponibles en el salón para esa fecha');
          this.cargarDisponibilidad();
          return;
        }
        this.cartService.guardarReserva({
          nombre: datos.nombre,
          cantPersonas: datos.cantPersonas,
          idSalon: salon.idSalon,
          nombreSalon: salon.nombre,
          capacidadMesa: this.capacidadMesa!,
          fechaReserva: datos.fechaReserva,
          horaReserva: datos.horaReserva
        });
        this.router.navigate(['/catalogo']);
      },
      error:()=> this.alertService.error('No se pudo verificar la disponibilidad del salón')
    });
  }

  //solo acepta horas de la lista, aunque el valor no venga del desplegable
  private horaPermitida = (control: AbstractControl): ValidationErrors | null => {
    if(!control.value) return null;
    return this.horas.includes(control.value) ? null : {horaNoPermitida: true};
  }

  //los lunes no hay atencion
  private fechaNoLunes = (control: AbstractControl): ValidationErrors | null => {
    if(!control.value) return null;
    return this.esLunes(control.value) ? {lunes: true} : null;
  }

  esLunes(fecha: string){
    const [anio, mes, dia] = fecha.split('-').map(Number);
    //Fecha de no antencion
    return new Date(anio, mes - 1, dia).getDay() === 1;
  }

  private generarHoras(inicio: number, fin: number, intervalo: number){
    const horas: string[] = [];
    for(let minutos = inicio * 60; minutos <= fin * 60; minutos += intervalo){
      const hh = String(Math.floor(minutos / 60)).padStart(2, '0');
      const mm = String(minutos % 60).padStart(2, '0');
      horas.push(`${hh}:${mm}`);
    }
    return horas;
  }

  private formatearFecha(fecha: Date){
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${mes}-${dia}`;
  }
}
