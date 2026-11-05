import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Producto } from '../interfaces/producto.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private http = inject(HttpClient);
  //usamos la ruta del backend
  private apiUrl = '/api/productos';

  //Listar ruta publica
  getProductos():Observable<Producto[]>{
    return this.http.get<Producto[]>(this.apiUrl).pipe(
      tap(productos =>{
        console.log('Productos recibidos', productos);
      })
    );
  }

  //Obtener por Id
  getProductoById(id:number) : Observable<Producto>{
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
  }

  //Para el admin
  crearProducto(formData: FormData):Observable<Producto>{
    console.log("Form data recibido create");
    formData.forEach((value, key)=>{
      console.log(`${key}:`, value);
    })
    return this.http.post<Producto>(this.apiUrl, formData);
  }

  actualizarProducto(id:number, formData: FormData):Observable<Producto>{
    console.log("Form data recibido update");
    formData.forEach((value, key)=>{
      console.log(`${key}:`, value);
    })
    return this.http.put<Producto>(`${this.apiUrl}/${id}`, formData);
  }

  eliminarProducto(id:number):Observable<void>{
    console.log("Id del producto a eliminar", id)
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
