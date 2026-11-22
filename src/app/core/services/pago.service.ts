import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Pago } from '../interfaces/pago.interface';

//Solo lectura: los pagos los registra el backend (el inicial de S/ 25 se crea con la reserva)
@Injectable({
  providedIn: 'root'
})
export class PagoService {
  private http = inject(HttpClient);
  //usamos la ruta del BACKEND
  private apiUrl = '/api/pagos';

  getPagos():Observable<Pago[]>{
    return this.http.get<Pago[]>(this.apiUrl);
  }
}
