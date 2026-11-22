import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ReporteService } from '../../core/services/reporte.service';
import { AlertService } from '../../core/service/alert.service';
import { Agrupacion, ClienteReservas, EstadoReservaCantidad, ProductoVendido, VentaPeriodo } from '../../core/interfaces/reporte.interface';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css'
})
export class ReportesComponent implements OnInit {
  private reporteService = inject(ReporteService);
  private alertService = inject(AlertService);
  private fb = inject(FormBuilder);

  ventas: VentaPeriodo[] = [];
  productos: ProductoVendido[] = [];
  estados: EstadoReservaCantidad[] = [];
  clientes: ClienteReservas[] = [];
  cargando = false;

  //pestaña visible
  pestana: 'VENTAS' | 'PRODUCTOS' | 'CLIENTES' | 'ESTADOS' = 'VENTAS';
  colores: Record<string, string> = {PENDIENTE: '#C9A227', CONFIRMADO: '#3E7B57', TERMINADO: '#4A6FA5', RECHAZADO: '#B54A3C'};
  agrupaciones: {valor: Agrupacion, texto: string}[] = [
    {valor: 'DIA', texto: 'Diario'},
    {valor: 'SEMANA', texto: 'Semanal'},
    {valor: 'MES', texto: 'Mensual'}
  ];

  //por defecto: desde el 1 de enero del año actual hasta hoy
  filtros = this.fb.group({
    fechaInicio: [`${new Date().getFullYear()}-01-01`, [Validators.required]],
    fechaFin: [this.formatearFecha(new Date()), [Validators.required]],
    agrupacion: ['DIA' as Agrupacion, [Validators.required]]
  });

  ngOnInit(): void {
    this.consultar();
    //consulta SQL sin filtros: reservas agrupadas por estado
    this.reporteService.getEstados().subscribe({
      next:(data)=> this.estados = data,
      error:()=> this.estados = []
    });
    //consulta SQL sin filtros: PERSONA y RESERVA por ID_PERSONA
    this.reporteService.getClientesConMasReservas().subscribe({
      next:(data)=> this.clientes = data,
      error:()=> this.clientes = []
    });
  }

  top5Clientes(){
    return this.clientes.slice(0, 5);
  }

  reservasTop5Clientes(){
    return this.top5Clientes().map(c => c.totalReservas);
  }

  totalEstados(){
    return this.estados.reduce((acc, e)=> acc + e.cantidad, 0);
  }

  //donut dibujado con conic-gradient, igual que en el Dashboard
  fondoDonut(){
    let acumulado = 0;
    const partes = this.estados.map(e => {
      const inicio = acumulado;
      acumulado += (e.cantidad / this.totalEstados()) * 100;
      return `${this.colores[e.estado] ?? '#999'} ${inicio}% ${acumulado}%`;
    });
    return `conic-gradient(${partes.join(', ')})`;
  }

  consultar(){
    const {fechaInicio, fechaFin, agrupacion} = this.filtros.getRawValue();
    if(!fechaInicio || !fechaFin || !agrupacion) return;
    if(fechaInicio > fechaFin){
      this.alertService.error('La fecha de inicio no puede ser posterior a la fecha de fin');
      return;
    }
    this.cargando = true;
    //los dos reportes vienen de los procedimientos almacenados de Oracle
    forkJoin({
      ventas: this.reporteService.getVentas(fechaInicio, fechaFin, agrupacion),
      productos: this.reporteService.getProductosMasVendidos(fechaInicio, fechaFin)
    }).subscribe({
      next:({ventas, productos})=>{
        this.ventas = ventas;
        this.productos = productos;
        this.cargando = false;
      },
      error:(err)=>{
        this.cargando = false;
        this.alertService.error(err.error?.mensaje ?? 'No se pudieron cargar los reportes');
      }
    });
  }

  //resumen del rango consultado
  totalVentas(){
    return this.ventas.reduce((acc, v)=> acc + v.reservasTerminadas, 0);
  }

  totalIngresos(){
    return this.ventas.reduce((acc, v)=> acc + v.ingresosTotales, 0);
  }

  promedio(){
    return this.totalVentas() > 0 ? this.totalIngresos() / this.totalVentas() : 0;
  }

  top5(){
    return this.productos.slice(0, 5);
  }

  //ancho de cada barra en porcentaje respecto al mayor valor
  porcentaje(valor: number, valores: number[]){
    const maximo = Math.max(...valores, 0);
    return maximo > 0 ? (valor / maximo) * 100 : 0;
  }

  ingresosVentas(){
    return this.ventas.map(v => v.ingresosTotales);
  }

  unidadesTop5(){
    return this.top5().map(p => p.unidadesVendidas);
  }

  etiquetaPeriodo(periodo: string){
    const [anio, mes, dia] = periodo.split('-').map(Number);
    const fecha = new Date(anio, mes - 1, dia);
    switch(this.filtros.value.agrupacion){
      case 'MES': return fecha.toLocaleDateString('es-PE', {month: 'long', year: 'numeric'});
      case 'SEMANA': return 'Semana del ' + fecha.toLocaleDateString('es-PE');
      default: return fecha.toLocaleDateString('es-PE');
    }
  }

  private formatearFecha(fecha: Date){
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${mes}-${dia}`;
  }
}
