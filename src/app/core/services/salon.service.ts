import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { Salon } from '../interfaces/salon.interface';
import { SalonNuevo } from '../interfaces/salon-mesa.interface';

@Injectable({
  providedIn: 'root'
})
export class SalonService {
  private http = inject(HttpClient);
  //usamos la ruta del BACKEND
  private apiUrl = '/api/salones';

  getSalones():Observable<Salon[]>{
    return this.http.get<Salon[]>(this.apiUrl);
  }

  getSalonById(id:number):Observable<Salon>{
    return this.http.get<Salon>(`${this.apiUrl}/${id}`);
  }

  //el backend calcula la disponibilidad por fecha (formato AAAA-MM-DD)
  getDisponibilidad(id:number, fecha:string):Observable<Salon>{
    return this.http.get<Salon>(`${this.apiUrl}/${id}/disponibilidad`, {params:{fecha}});
  }

  //Para el admin (Gestion de Salones): estructura del SalonDTO
  listarSalones():Observable<SalonNuevo[]>{
    return this.http.get<SalonNuevo[]>(this.apiUrl);
  }

  crearSalon(salon: SalonNuevo):Observable<SalonNuevo>{
    return this.http.post<SalonNuevo>(this.apiUrl, salon);
  }

  actualizarSalon(id:number, salon: SalonNuevo):Observable<SalonNuevo>{
    return this.http.put<SalonNuevo>(`${this.apiUrl}/${id}`, salon);
  }

  eliminarSalon(id:number):Observable<void>{
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  //consulta varias fechas a la vez, por ejemplo los dias de un mes del calendario
  getDisponibilidadFechas(id:number, fechas:string[]):Observable<Salon[]>{
    return forkJoin(fechas.map(fecha => this.getDisponibilidad(id, fecha)));
  }
}
