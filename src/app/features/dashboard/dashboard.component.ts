import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ReservaService } from '../../core/services/reserva.service';
import { ProductoService } from '../../core/services/producto.service';
import { SalonService } from '../../core/services/salon.service';
import { ReporteService } from '../../core/services/reporte.service';
import { AlertService } from '../../core/service/alert.service';
import { Reserva } from '../../core/interfaces/reserva.interface';
import { Producto } from '../../core/interfaces/producto.interface';
import { Salon } from '../../core/interfaces/salon.interface';
import { ProductoVendido } from '../../core/interfaces/reporte.interface';

interface Barra { etiqueta: string; monto: number; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private reservaService = inject(ReservaService);
  private productoService = inject(ProductoService);
  private salonService = inject(SalonService);
  private reporteService = inject(ReporteService);
  private alertService = inject(AlertService);

  //datos reales del backend
  reservas: Reserva[] = [];
  productos: Producto[] = [];
  salones: Salon[] = [];
  topProductos: ProductoVendido[] = [];
  cargando = true;

  //filtro por fecha: por defecto, desde el 1 del mes actual hasta hoy
  hoy = new Date();
  desde = this.formatear(new Date(this.hoy.getFullYear(), this.hoy.getMonth(), 1));
  hasta = this.formatear(this.hoy);

  agrupacion: 'DIA' | 'SEMANA' | 'MES' = 'MES';
  estados = [
    {valor: 'PENDIENTE', clase: 'pendiente', color: '#C9A227'},
    {valor: 'CONFIRMADO', clase: 'confirmado', color: '#3E7B57'},
    {valor: 'TERMINADO', clase: 'terminado', color: '#4A6FA5'},
    {valor: 'RECHAZADO', clase: 'rechazado', color: '#B54A3C'}
  ];
  meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  ngOnInit(): void {
    forkJoin({
      reservas: this.reservaService.getReservas(),
      productos: this.productoService.getProductos(),
      salones: this.salonService.getSalones()
    }).subscribe({
      next:(data)=>{
        this.reservas = data.reservas;
        this.productos = data.productos;
        this.salones = data.salones;
        this.cargando = false;
      },
      error:()=>{
        this.cargando = false;
        this.alertService.error('No se pudieron cargar los datos del dashboard');
      }
    });
    this.cargarTopProductos();
  }

  //el ranking viene de SP_RANKING_PRODUCTOS_VENDIDOS y depende del filtro de fechas
  cargarTopProductos(){
    if(!this.desde || !this.hasta || this.desde > this.hasta) return;
    this.reporteService.getProductosMasVendidos(this.desde, this.hasta).subscribe({
      next:(data)=> this.topProductos = data.slice(0, 5),
      error:()=> this.topProductos = []
    });
  }

  // ---------- Tarjetas de resumen ----------

  reservasEnRango(desde = this.desde, hasta = this.hasta){
    return this.reservas.filter(r => r.fechaReserva >= desde && r.fechaReserva <= hasta);
  }

  //ingresos = total de las reservas TERMINADO (venta concluida)
  ingresos(lista: Reserva[]){
    return lista.filter(r => r.estadoReserva === 'TERMINADO').reduce((acc, r)=> acc + (r.total ?? 0), 0);
  }

  terminadas(lista: Reserva[]){
    return lista.filter(r => r.estadoReserva === 'TERMINADO').length;
  }

  //mismo numero de dias, justo antes del rango elegido
  rangoAnterior(){
    const dias = this.diasEntre(this.desde, this.hasta) + 1;
    const fin = this.sumarDias(this.desde, -1);
    return this.reservasEnRango(this.sumarDias(fin, -(dias - 1)), fin);
  }

  //variacion porcentual; null cuando no hay datos para comparar
  variacion(actual: number, anterior: number){
    return anterior > 0 ? ((actual - anterior) / anterior) * 100 : null;
  }

  productosConStock(){
    return this.productos.filter(p => p.stock > 0).length;
  }

  // ---------- Grafico de ventas ----------

  barras(): Barra[]{
    const ventas = this.reservas.filter(r => r.estadoReserva === 'TERMINADO');
    const suma = (desde: string, hasta: string) => ventas
      .filter(r => r.fechaReserva >= desde && r.fechaReserva <= hasta)
      .reduce((acc, r)=> acc + (r.total ?? 0), 0);

    if(this.agrupacion === 'MES'){
      //meses del año de la fecha final, hasta ese mes
      const [anio, mesFin] = this.hasta.split('-').map(Number);
      return Array.from({length: mesFin}, (_, i) => ({
        etiqueta: this.meses[i],
        monto: suma(this.formatear(new Date(anio, i, 1)), this.formatear(new Date(anio, i + 1, 0)))
      }));
    }
    const lista: Barra[] = [];
    //semanas de lunes a domingo, o un dia por barra
    let inicio = this.agrupacion === 'SEMANA' ? this.lunesDe(this.desde) : this.desde;
    const paso = this.agrupacion === 'SEMANA' ? 7 : 1;
    while(inicio <= this.hasta){
      const [, mes, dia] = inicio.split('-');
      lista.push({etiqueta: `${dia}/${mes}`, monto: suma(inicio, this.sumarDias(inicio, paso - 1))});
      inicio = this.sumarDias(inicio, paso);
    }
    return lista;
  }

  //escala del eje Y redondeada (1, 2, 2.5 o 5 por potencia de 10)
  escalaMaxima(barras: Barra[]){
    const max = Math.max(...barras.map(b => b.monto), 0);
    if(max === 0) return 0;
    const potencia = Math.pow(10, Math.floor(Math.log10(max)));
    const paso = [1, 2, 2.5, 5, 10].find(f => f * potencia >= max) ?? 10;
    return paso * potencia;
  }

  ejeY(maximo: number){
    return [1, 0.75, 0.5, 0.25, 0].map(f => maximo * f);
  }

  montoCorto(valor: number){
    return valor >= 1000 ? `S/ ${+(valor / 1000).toFixed(1)}k` : `S/ ${Math.round(valor)}`;
  }

  // ---------- Reservas por estado ----------

  cantidadPorEstado(estado: string){
    return this.reservasEnRango().filter(r => r.estadoReserva === estado).length;
  }

  //donut dibujado con conic-gradient
  fondoDonut(){
    const total = this.reservasEnRango().length;
    let acumulado = 0;
    const partes = this.estados.map(e => {
      const inicio = acumulado;
      acumulado += (this.cantidadPorEstado(e.valor) / total) * 100;
      return `${e.color} ${inicio}% ${acumulado}%`;
    });
    return `conic-gradient(${partes.join(', ')})`;
  }

  // ---------- Reservas recientes ----------

  recientes(){
    return [...this.reservas].sort((a, b) => (b.idReserva ?? 0) - (a.idReserva ?? 0)).slice(0, 5);
  }

  nombreSalon(idSalon: number){
    return this.salones.find(s => s.idSalon === idSalon)?.nombre ?? `Salón ${idSalon}`;
  }

  claseEstado(estado: string){
    return this.estados.find(e => e.valor === estado)?.clase ?? '';
  }

  // ---------- Fechas (AAAA-MM-DD, hora local) ----------

  fechaLarga(){
    const texto = this.hoy.toLocaleDateString('es-PE', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'});
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  fechaCorta(fecha: string){
    const [anio, mes, dia] = fecha.split('-');
    return `${dia}/${mes}/${anio}`;
  }

  private aFecha(texto: string){
    const [anio, mes, dia] = texto.split('-').map(Number);
    return new Date(anio, mes - 1, dia);
  }

  private sumarDias(texto: string, dias: number){
    const fecha = this.aFecha(texto);
    fecha.setDate(fecha.getDate() + dias);
    return this.formatear(fecha);
  }

  private diasEntre(desde: string, hasta: string){
    return Math.round((this.aFecha(hasta).getTime() - this.aFecha(desde).getTime()) / 86400000);
  }

  private lunesDe(texto: string){
    const dia = this.aFecha(texto).getDay();
    return this.sumarDias(texto, -((dia + 6) % 7));
  }

  private formatear(fecha: Date){
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${mes}-${dia}`;
  }
}
