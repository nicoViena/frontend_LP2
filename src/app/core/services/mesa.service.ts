import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Mesa } from '../interfaces/mesa.interface';
import { MesaNueva } from '../interfaces/salon-mesa.interface';

@Injectable({
  providedIn: 'root'
})
export class MesaService {
  private http = inject(HttpClient);
  //usamos la ruta del BACKEND
  private apiUrl = '/api/mesas';

  getMesas():Observable<Mesa[]>{
    return this.http.get<Mesa[]>(this.apiUrl);
  }

  //la capacidad por mesa depende del tipo de mesa asignado al salon
  getMesaById(id:number):Observable<Mesa>{
    return this.http.get<Mesa>(`${this.apiUrl}/${id}`);
  }

  //Para el admin (Gestion de Mesas): estructura del MesaDTO
  //filtros opcionales: mesas de un salon y su disponibilidad en una fecha (AAAA-MM-DD)
  listarMesas(idSalon?: number, fecha?: string):Observable<MesaNueva[]>{
    const params: Record<string, string> = {};
    if(idSalon) params['idSalon'] = String(idSalon);
    if(fecha) params['fecha'] = fecha;
    return this.http.get<MesaNueva[]>(this.apiUrl, {params});
  }

  crearMesa(mesa: MesaNueva):Observable<MesaNueva>{
    return this.http.post<MesaNueva>(this.apiUrl, mesa);
  }

  actualizarMesa(id:number, mesa: MesaNueva):Observable<MesaNueva>{
    return this.http.put<MesaNueva>(`${this.apiUrl}/${id}`, mesa);
  }

  eliminarMesa(id:number):Observable<void>{
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
