import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Agrupacion, ClienteReservas, EstadoReservaCantidad, ProductoVendido, VentaPeriodo } from '../interfaces/reporte.interface';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private http = inject(HttpClient);
  //usamos la ruta del BACKEND
  private apiUrl = '/api/reportes';

  //fechas en formato AAAA-MM-DD
  getProductosMasVendidos(fechaInicio:string, fechaFin:string):Observable<ProductoVendido[]>{
    return this.http.get<ProductoVendido[]>(`${this.apiUrl}/productos-mas-vendidos`, {params:{fechaInicio, fechaFin}});
  }

  getVentas(fechaInicio:string, fechaFin:string, agrupacion:Agrupacion):Observable<VentaPeriodo[]>{
    return this.http.get<VentaPeriodo[]>(`${this.apiUrl}/ventas`, {params:{fechaInicio, fechaFin, agrupacion}});
  }

  getEstados():Observable<EstadoReservaCantidad[]>{
    return this.http.get<EstadoReservaCantidad[]>(`${this.apiUrl}/estados`);
  }

  getClientesConMasReservas():Observable<ClienteReservas[]>{
    return this.http.get<ClienteReservas[]>(`${this.apiUrl}/clientes-mas-reservas`);
  }
}
