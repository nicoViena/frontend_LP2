import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ProductoService } from '../../core/services/producto.service';
import { Producto } from '../../core/interfaces/producto.interface';
import { CartService } from '../../core/services/cart.service';
import { DatosReserva } from '../../core/interfaces/reserva.interface';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit{
  private productoService = inject(ProductoService);
  public cartService = inject(CartService);
  private router = inject(Router);
  productos: Producto[] = [];
  reserva: DatosReserva | null = null;

  ngOnInit(): void {
    //sin datos de reserva no se puede elegir productos
    this.reserva = this.cartService.getReserva();
    if(!this.reserva){
      this.router.navigate(['/reserva']);
      return;
    }
    this.loadingProducts();
  }

  loadingProducts(){
    this.productoService.getProductos().subscribe({
      next:(data)=> this.productos = data,
      error:(err) => console.error('Error al cargar productos', err)
    });
  }

  cantidadEnCarrito(producto: Producto){
    const item = this.cartService.getItems().find(i => i.producto.idProducto === producto.idProducto);
    return item ? item.cantidad : 0;
  }

  agregarAlCarrito(producto : Producto){
    this.cartService.agregarProducto(producto);
  }

  disminuir(producto: Producto){
    if(this.cantidadEnCarrito(producto) <= 1){
      this.cartService.eliminarItem(producto.idProducto!);
    } else {
      this.cartService.actualizarCantidad(producto.idProducto!, -1);
    }
  }

  aumentar(producto: Producto){
    this.cartService.actualizarCantidad(producto.idProducto!, 1);
  }

}
