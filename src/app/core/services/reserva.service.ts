import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Reserva, ReservaMesaDTO, ReservaResponseDTO, SolicitudReservaMesaDTO } from '../interfaces/reserva.interface';

@Injectable({
  providedIn: 'root'
})
export class ReservaService {
  private http = inject(HttpClient);
  //usamos la ruta del BACKEND
  private apiUrl = '/api/reservas';

  getReservas():Observable<Reserva[]>{
    return this.http.get<Reserva[]>(this.apiUrl);
  }

  //Mis Reservas: el backend lee el token y a un CLIENTE solo le devuelve sus propias reservas
  getMisReservas():Observable<ReservaMesaDTO[]>{
    return this.http.get<ReservaMesaDTO[]>(this.apiUrl);
  }

  getReservaById(id:number):Observable<ReservaMesaDTO>{
    return this.http.get<ReservaMesaDTO>(`${this.apiUrl}/${id}`);
  }

  //el backend crea la reserva en PENDIENTE y genera el pago inicial de S/ 25
  crearReserva(reserva: SolicitudReservaMesaDTO):Observable<ReservaResponseDTO>{
    return this.http.post<ReservaResponseDTO>(this.apiUrl, reserva);
  }

  actualizarReserva(id:number, reserva: ReservaMesaDTO):Observable<ReservaMesaDTO>{
    return this.http.put<ReservaMesaDTO>(`${this.apiUrl}/${id}`, reserva);
  }

  eliminarReserva(id:number):Observable<void>{
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
