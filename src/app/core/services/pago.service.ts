import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Pago } from '../interfaces/pago.interface';

//Pagos del backend: el inicial de S/ 25 se crea con la reserva y se paga con Yape o Plin
@Injectable({
  providedIn: 'root'
})
export class PagoService {
  private http = inject(HttpClient);
  //usamos la ruta del BACKEND
  private apiUrl = '/api/pagos';

  //ADMIN: todos los pagos
  getPagos():Observable<Pago[]>{
    return this.http.get<Pago[]>(this.apiUrl);
  }

  //ADMIN o el cliente dueño de la reserva (el backend lo valida)
  getPagosDeReserva(idReserva: number):Observable<Pago[]>{
    return this.http.get<Pago[]>(`${this.apiUrl}/reserva/${idReserva}`);
  }

  //imagen protegida: se pide con el token y se muestra como Blob
  verComprobante(idPago: number):Observable<Blob>{
    return this.http.get(`${this.apiUrl}/${idPago}/comprobante`, {responseType: 'blob'});
  }

  //solo ADMIN
  aprobar(idPago: number):Observable<Pago>{
    return this.http.put<Pago>(`${this.apiUrl}/${idPago}/aprobar`, {});
  }

  rechazar(idPago: number):Observable<Pago>{
    return this.http.put<Pago>(`${this.apiUrl}/${idPago}/rechazar`, {});
  }

  //pago de separacion de S/ 25 de una reserva
  separacion(pagos: Pago[]): Pago | undefined {
    return pagos.find(p => p.tipoComprobante === 'RESERVA');
  }
}
