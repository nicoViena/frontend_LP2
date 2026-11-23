import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReservaService } from '../../../core/services/reserva.service';
import { SalonService } from '../../../core/services/salon.service';
import { PagoService } from '../../../core/services/pago.service';
import { AlertService } from '../../../core/service/alert.service';
import { MesaService } from '../../../core/services/mesa.service';
import { ProductoService } from '../../../core/services/producto.service';
import { ReporteService } from '../../../core/services/reporte.service';
import { DetalleReservaDTO, ReservaMesaDTO } from '../../../core/interfaces/reserva.interface';
import { Salon } from '../../../core/interfaces/salon.interface';
import { MesaNueva } from '../../../core/interfaces/salon-mesa.interface';
import { Producto } from '../../../core/interfaces/producto.interface';
import { Pago } from '../../../core/interfaces/pago.interface';
import { Observable } from 'rxjs';

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
  private mesaService = inject(MesaService);
  private productoService = inject(ProductoService);
  private reporteService = inject(ReporteService);
  //modelo actual: RESERVA -> MESA -> SALON
  reservas: ReservaMesaDTO[]=[];
  salones: Salon[]=[];
  mesas: MesaNueva[]=[];
  productos: Producto[]=[];
  //nombre de cada cliente por idPersona (ReservaDTO solo trae el id)
  clientes: Record<number, string> = {};
  pagos: Pago[]=[];
  //productos de la reserva abierta en el detalle
  detalles: DetalleReservaDTO[] = [];
  cargandoDetalles = false;
  estados = ['PENDIENTE', 'CONFIRMADO', 'RECHAZADO', 'TERMINADO'];

  //el backend no tiene filtros: se filtra la lista ya cargada
  desde = '';
  hasta = '';
  busqueda = '';
  estado = '';

  pagina = 1;
  porPagina = 8;
  detalle: ReservaMesaDTO | null = null;
  //comprobante abierto en el detalle (URL temporal del Blob)
  comprobanteUrl: string | null = null;
  comprobanteDe: number | null = null;
  procesandoPago = false;

  ngOnInit(): void {
    this.listReservas();
    //datos de apoyo para mostrar nombres (endpoints existentes)
    this.mesaService.listarMesas().subscribe({next:(data)=> this.mesas = data, error:()=> this.mesas = []});
    this.productoService.getProductos().subscribe({next:(data)=> this.productos = data, error:()=> this.productos = []});
    //GET /api/reportes/clientes-mas-reservas (ADMIN): idPersona y nombre de quienes tienen reservas
    this.reporteService.getClientesConMasReservas().subscribe({
      next:(data)=> data.forEach(c => this.clientes[c.idPersona] = c.nombre),
      error:()=> this.clientes = {}
    });
  }

  listReservas(){
    //mas recientes primero (por fecha de reserva y luego por ID)
    this.reservaService.listarReservas().subscribe({
      next:(data)=>{
        this.reservas = [...data].sort((a, b) =>
          b.fechaReserva.localeCompare(a.fechaReserva) || (b.idReserva ?? 0) - (a.idReserva ?? 0));
        //si el detalle esta abierto, muestra los montos actualizados
        if(this.detalle) this.detalle = this.reservas.find(r => r.idReserva === this.detalle!.idReserva) ?? this.detalle;
      },
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
      (!texto || this.nombreCliente(r.idPersona).toLowerCase().includes(texto) || String(r.idReserva) === texto)
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
  //el salon se obtiene a traves de la mesa asignada
  nombreSalon(idMesa: number){
    const idSalon = this.mesas.find(m => m.idMesa === idMesa)?.idSalon;
    return this.salones.find(s => s.idSalon === idSalon)?.nombre ?? '-';
  }

  nombreMesa(idMesa: number){
    return this.mesas.find(m => m.idMesa === idMesa)?.nombre ?? `Mesa ${idMesa}`;
  }

  nombreCliente(idPersona: number){
    return this.clientes[idPersona] ?? `Persona ${idPersona}`;
  }

  nombreProducto(idProducto: number){
    return this.productos.find(p => p.idProducto === idProducto)?.nombre ?? `Producto ${idProducto}`;
  }

  //abre el detalle y carga sus productos (GET /api/reservas/{id}/detalles)
  abrirDetalle(r: ReservaMesaDTO){
    this.liberarComprobante();
    this.detalle = r;
    this.detalles = [];
    this.cargandoDetalles = true;
    this.reservaService.getDetalles(r.idReserva!).subscribe({
      next:(data)=>{ this.detalles = data; this.cargandoDetalles = false; },
      error:()=>{ this.detalles = []; this.cargandoDetalles = false; }
    });
  }

  fechaCorta(fecha: string | null){
    if(!fecha) return '-';
    const [anio, mes, dia] = fecha.substring(0, 10).split('-');
    return `${dia}/${mes}/${anio}`;
  }

  //pagos reales registrados en el backend para la reserva
  pagosDe(reserva: ReservaMesaDTO){
    return this.pagos.filter(p => p.idReserva === reserva.idReserva);
  }

  // ---------- Pago de separacion con Yape / Plin ----------
  claseEstadoPago(estado: string){
    if(estado === 'PAGADO') return 'confirmado';
    if(estado === 'RECHAZADO') return 'rechazado';
    return 'pendiente';
  }

  //la imagen no es publica: se descarga con el token y se muestra como Blob
  verComprobante(p: Pago){
    this.pagoService.verComprobante(p.idPago).subscribe({
      next:(imagen)=>{
        this.liberarComprobante();
        this.comprobanteUrl = URL.createObjectURL(imagen);
        this.comprobanteDe = p.idPago;
      },
      error:(err)=> this.alertService.error(err.error?.mensaje ?? 'No se pudo cargar el comprobante')
    });
  }

  async aprobarPago(p: Pago){
    const ok = await this.alertService.confirm(`Si el voucher de ${p.tipoPago} es válido, el pago quedará PAGADO. Luego cambia la reserva a CONFIRMADO con Editar reserva.`, '¿Aprobar voucher?');
    if(ok) this.resolverPago(this.pagoService.aprobar(p.idPago), 'Pago aprobado');
  }

  async rechazarPago(p: Pago){
    const ok = await this.alertService.confirm('Si el voucher no es válido, el pago quedará RECHAZADO. Luego cambia la reserva a RECHAZADO con Editar reserva (eso devuelve el stock).', '¿Rechazar voucher?');
    if(ok) this.resolverPago(this.pagoService.rechazar(p.idPago), 'Voucher rechazado');
  }

  private resolverPago(peticion: Observable<Pago>, mensaje: string){
    this.procesandoPago = true;
    peticion.subscribe({
      next:(actualizado)=>{
        this.procesandoPago = false;
        this.pagos = this.pagos.map(p => p.idPago === actualizado.idPago ? actualizado : p);
        this.alertService.toast(mensaje);
        //recarga montos pagados y saldo de las reservas
        this.listReservas();
      },
      error:(err)=>{
        this.procesandoPago = false;
        this.alertService.error(err.error?.mensaje ?? 'No se pudo actualizar el pago');
        this.listReservas();
      }
    });
  }

  cerrarDetalle(){
    this.detalle = null;
    this.liberarComprobante();
  }

  private liberarComprobante(){
    if(this.comprobanteUrl) URL.revokeObjectURL(this.comprobanteUrl);
    this.comprobanteUrl = null;
    this.comprobanteDe = null;
  }

  async eliminar(r: ReservaMesaDTO){
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
