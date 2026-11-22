import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SalonService } from '../../core/services/salon.service';
import { MesaService } from '../../core/services/mesa.service';
import { CartService } from '../../core/services/cart.service';
import { AlertService } from '../../core/service/alert.service';
import { Salon } from '../../core/interfaces/salon.interface';
import { MesaNueva } from '../../core/interfaces/salon-mesa.interface';
import { PasosReservaComponent } from '../../shared/pasos-reserva/pasos-reserva.component';

interface DiaCalendario{
  fecha: string;
  dia: number;
}

@Component({
  selector: 'app-reserva',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PasosReservaComponent],
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
  //paso del formulario: 1 Datos, 2 Fecha y hora (el mismo formulario guarda ambos)
  etapa = 1;
  salones: Salon[] = [];
  salonSeleccionado: Salon | null = null;
  //mesas del salon para la fecha elegida; el cliente escoge una manualmente
  mesas: MesaNueva[] = [];

  //calendario del mes visible
  nombresDias = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
  mesActual = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  dias: (DiaCalendario | null)[] = [];
  //mesas libres por fecha, segun el backend
  disponibilidad: Record<string, number> = {};
  hoy = this.formatearFecha(new Date());
  //horario de atencion: 10:00 a 17:00 cada 30 minutos (formato HH:mm del backend) (Ultimo digito la ctd de min)
  horas = this.generarHoras(10, 17, 30);

  constructor(){
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      cantPersonas: [1, [Validators.required, Validators.min(1)]],
      motivo: ['', [Validators.maxLength(100)]],
      idSalon: [null, [Validators.required]],
      idMesa: [null as number | null, [Validators.required]],
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
    //al cambiar la fecha se consultan las mesas libres de ese dia
    this.form.get('fechaReserva')?.valueChanges.subscribe(()=> this.cargarMesas());
    //si la mesa elegida ya no alcanza para las personas, se limpia
    this.form.get('cantPersonas')?.valueChanges.subscribe(()=>{
      const mesa = this.mesaSeleccionada();
      if(mesa && !this.mesaSeleccionable(mesa)) this.form.get('idMesa')?.setValue(null);
    });
  }

  seleccionarSalon(id: number){
    this.salonSeleccionado = this.salones.find(s => s.idSalon === id) ?? null;
    this.disponibilidad = {};
    this.cargarDisponibilidad();
    this.cargarMesas();
  }

  //GET /api/mesas?idSalon=&fecha= : el backend indica si cada mesa esta libre ese dia
  cargarMesas(){
    const salon = this.salonSeleccionado;
    const fecha = this.form.get('fechaReserva')?.value;
    if(!salon || !fecha){
      this.mesas = [];
      return;
    }
    this.mesaService.listarMesas(salon.idSalon, fecha).subscribe({
      next:(data)=>{
        this.mesas = data;
        //la mesa elegida antes se conserva solo si sigue siendo valida
        const mesa = this.mesaSeleccionada();
        if(!mesa || !this.mesaSeleccionable(mesa)) this.form.get('idMesa')?.setValue(null);
      },
      error:()=> this.alertService.error('No se pudieron consultar las mesas del salón')
    });
  }

  mesaSeleccionada(){
    return this.mesas.find(m => m.idMesa === this.form.get('idMesa')?.value) ?? null;
  }

  //se puede elegir si esta libre y su capacidad alcanza para las personas
  mesaSeleccionable(m: MesaNueva){
    return !!m.disponible && m.capacidad >= Number(this.form.get('cantPersonas')?.value);
  }

  //texto que acompana a cada mesa en el desplegable
  motivoMesa(m: MesaNueva){
    if(!m.disponible) return ' (ocupada)';
    if(!this.mesaSeleccionable(m)) return ' (capacidad insuficiente)';
    return '';
  }

  //capacidad de la mesa mas grande del salon, para orientar al cliente
  capacidadMaxima(){
    return this.mesas.length ? Math.max(...this.mesas.map(m => m.capacidad)) : null;
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
          if(s.fecha) this.disponibilidad[s.fecha] = s.mdisponible ?? 0;
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

  //paso 1 -> paso 2: solo se validan los datos del primer paso
  irAFechaHora(){
    const campos = ['nombre', 'cantPersonas', 'motivo'];
    campos.forEach(c => this.form.get(c)?.markAsTouched());
    if(campos.some(c => this.form.get(c)?.invalid)){
      this.alertService.error('Completa correctamente tus datos');
      return;
    }
    this.etapa = 2;
  }

  siguiente(){
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
    const datos = this.form.value;
    if(!salon) return;
    if(salon.estado !== 'DISPONIBLE'){
      this.alertService.error('El salón no está disponible');
      return;
    }
    //se vuelve a consultar al backend que la mesa elegida siga libre y alcance para las personas
    this.mesaService.listarMesas(salon.idSalon, datos.fechaReserva).subscribe({
      next:(data)=>{
        this.mesas = data;
        const mesa = this.mesaSeleccionada();
        if(!mesa || !mesa.disponible){
          this.form.get('idMesa')?.setValue(null);
          this.alertService.error('La mesa elegida ya no está disponible para esa fecha. Elige otra mesa');
          this.cargarDisponibilidad();
          return;
        }
        if(mesa.capacidad < datos.cantPersonas){
          this.alertService.error(`${mesa.nombre} permite hasta ${mesa.capacidad} personas. Elige otra mesa`);
          return;
        }
        this.cartService.guardarReserva({
          nombre: datos.nombre,
          motivo: datos.motivo,
          cantPersonas: datos.cantPersonas,
          idSalon: salon.idSalon,
          nombreSalon: salon.nombre,
          idMesa: mesa.idMesa!,
          nombreMesa: mesa.nombre,
          capacidadMesa: mesa.capacidad,
          fechaReserva: datos.fechaReserva,
          horaReserva: datos.horaReserva
        });
        this.router.navigate(['/catalogo']);
      },
      error:()=> this.alertService.error('No se pudo verificar la disponibilidad de la mesa')
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
