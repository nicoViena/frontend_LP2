import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { Salon, SalonRequest } from '../interfaces/salon.interface';

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

  //Para el admin
  crearSalon(salon: SalonRequest):Observable<Salon>{
    return this.http.post<Salon>(this.apiUrl, salon);
  }

  actualizarSalon(id:number, salon: SalonRequest):Observable<Salon>{
    return this.http.put<Salon>(`${this.apiUrl}/${id}`, salon);
  }

  eliminarSalon(id:number):Observable<void>{
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  //consulta varias fechas a la vez, por ejemplo los dias de un mes del calendario
  getDisponibilidadFechas(id:number, fechas:string[]):Observable<Salon[]>{
    return forkJoin(fechas.map(fecha => this.getDisponibilidad(id, fecha)));
  }
}
