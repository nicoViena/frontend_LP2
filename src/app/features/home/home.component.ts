import { PasosReservaComponent } from '../../shared/pasos-reserva/pasos-reserva.component';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ProductoService } from '../../core/services/producto.service';
import { Producto } from '../../core/interfaces/producto.interface';
import { CartService } from '../../core/services/cart.service';
import { DatosReserva } from '../../core/interfaces/reserva.interface';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, PasosReservaComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit{
  public productoService = inject(ProductoService);
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

  //filtra por nombre ignorando mayusculas; el carrito y la reserva no se tocan
  productosFiltrados(){
    const texto = this.productoService.busqueda().toLowerCase();
    return this.productos.filter(p => p.nombre.toLowerCase().includes(texto));
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
