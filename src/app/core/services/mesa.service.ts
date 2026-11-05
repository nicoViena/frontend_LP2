import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Mesa } from '../interfaces/mesa.interface';

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

  //Para el admin
  crearMesa(mesa: Mesa):Observable<Mesa>{
    return this.http.post<Mesa>(this.apiUrl, mesa);
  }

  actualizarMesa(id:number, mesa: Mesa):Observable<Mesa>{
    return this.http.put<Mesa>(`${this.apiUrl}/${id}`, mesa);
  }

  eliminarMesa(id:number):Observable<void>{
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
