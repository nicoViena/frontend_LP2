import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReservaService } from '../../../core/services/reserva.service';
import { SalonService } from '../../../core/services/salon.service';
import { PagoService } from '../../../core/services/pago.service';
import { AlertService } from '../../../core/service/alert.service';
import { Reserva } from '../../../core/interfaces/reserva.interface';
import { Salon } from '../../../core/interfaces/salon.interface';
import { Pago } from '../../../core/interfaces/pago.interface';

@Component({
  selector: 'app-reserva-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './reserva-list.component.html',
  styleUrl: './reserva-list.component.css'
})
export class ReservaListComponent implements OnInit {
  private reservaService = inject(ReservaService);
  private salonService = inject(SalonService);
  private pagoService = inject(PagoService);
  private alertService = inject(AlertService)
  reservas: Reserva[]=[];
  salones: Salon[]=[];
  pagos: Pago[]=[];
  estados = ['PENDIENTE', 'CONFIRMADO', 'RECHAZADO', 'TERMINADO'];

  //el backend no tiene filtros: se filtra la lista ya cargada
  desde = '';
  hasta = '';
  busqueda = '';
  estado = '';

  pagina = 1;
  porPagina = 8;
  detalle: Reserva | null = null;

  ngOnInit(): void {
    this.listReservas();
  }

  listReservas(){
    //mas recientes primero (por fecha de reserva y luego por ID)
    this.reservaService.getReservas().subscribe({
      next:(data)=> this.reservas = [...data].sort((a, b) =>
        b.fechaReserva.localeCompare(a.fechaReserva) || (b.idReserva ?? 0) - (a.idReserva ?? 0)),
      error:()=> this.alertService.error('No se pudieron cargar las reservas')
    });
    this.salonService.getSalones().subscribe
    (data=> this.salones=data);
    this.pagoService.getPagos().subscribe({
      next:(data)=> this.pagos = data,
      error:()=> this.pagos = []
    });
  }

  // ---------- Tarjetas ----------
  cantidad(estado: string){
    return this.reservas.filter(r => r.estadoReserva === estado).length;
  }

  // ---------- Filtros y paginacion ----------
  reservasFiltradas(){
    const texto = this.busqueda.trim().toLowerCase().replace('#r-', '');
    return this.reservas.filter(r =>
      (!this.desde || r.fechaReserva >= this.desde) &&
      (!this.hasta || r.fechaReserva <= this.hasta) &&
      (!this.estado || r.estadoReserva === this.estado) &&
      (!texto || r.nombre.toLowerCase().includes(texto) || String(r.idReserva) === texto)
    );
  }

  paginaActual(){
    const inicio = (this.pagina - 1) * this.porPagina;
    return this.reservasFiltradas().slice(inicio, inicio + this.porPagina);
  }

  totalPaginas(){
    return Math.max(1, Math.ceil(this.reservasFiltradas().length / this.porPagina));
  }

  paginas(){
    return Array.from({length: this.totalPaginas()}, (_, i) => i + 1);
  }

  filtrar(){
    this.pagina = 1;
  }

  limpiarFiltros(){
    this.desde = '';
    this.hasta = '';
    this.busqueda = '';
    this.estado = '';
    this.pagina = 1;
  }

  // ---------- Utilidades ----------
  nombreSalon(idSalon: number){
    return this.salones.find(s => s.idSalon === idSalon)?.nombre ?? `Salón ${idSalon}`;
  }

  fechaCorta(fecha: string | null){
    if(!fecha) return '-';
    const [anio, mes, dia] = fecha.substring(0, 10).split('-');
    return `${dia}/${mes}/${anio}`;
  }

  //pagos reales registrados en el backend para la reserva
  pagosDe(reserva: Reserva){
    return this.pagos.filter(p => p.idReserva === reserva.idReserva);
  }

  async eliminar(r: Reserva){
    const confirmado = await this.alertService.confirm(`Se eliminará la reserva #R-${r.idReserva} y se devolverá el stock de sus productos. Esta accion no se puede deshacer`);
    if(confirmado) {
      //el backend no elimina reservas con pagos confirmados y responde con un mensaje
      this.reservaService.eliminarReserva(r.idReserva!).subscribe({
        next: ()=>{
          this.alertService.toast('Reserva Eliminada')
          this.listReservas()
        }, error: (err) => this.alertService.error(err.error?.mensaje ?? 'No se pudo eliminar la reserva')
      });
    }
  }
}
