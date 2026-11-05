import { computed, inject, Injectable, signal } from '@angular/core';
import { AlertService } from '../service/alert.service';
import { CartItem } from '../interfaces/cart-item.interface';
import { Producto } from '../interfaces/producto.interface';
import { DatosReserva } from '../interfaces/reserva.interface';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private alertService = inject(AlertService);
  private cartItems = signal<CartItem[]>(this.loadCart());
  private reserva = signal<DatosReserva | null>(this.loadReserva());

  //el backend cobra S/ 25 de adelanto y ese es el total minimo de una reserva
  readonly adelanto = 25;

  private loadCart(): CartItem[]{
    const cart = localStorage.getItem('cart_vimalu');
    return cart ? JSON.parse(cart) :[];
  }

  private loadReserva(): DatosReserva | null{
    const reserva = localStorage.getItem('reserva_vimalu');
    return reserva ? JSON.parse(reserva) : null;
  }
  //suma de las unidades de todos los productos
  totalItems = computed(()=> this.cartItems().reduce((acc, item)=> acc + item.cantidad, 0));

  getItems(){
    return this.cartItems();
  }

  getReserva(){
    return this.reserva();
  }

  private saveCart(){
    localStorage.setItem('cart_vimalu', JSON.stringify(this.cartItems()));
  }

  //subtotal de productos
  totalPrice = computed(() =>
    this.cartItems().reduce((acc, item)=> acc +(item.producto.precio * item.cantidad), 0)
  );

  //igual que el backend: el total nunca es menor al adelanto
  totalReserva = computed(() => Math.max(this.totalPrice(), this.adelanto));

  saldoEstimado = computed(() => this.totalReserva() - this.adelanto);

  guardarReserva(datos: DatosReserva){
    this.reserva.set(datos);
    localStorage.setItem('reserva_vimalu', JSON.stringify(datos));
  }

  agregarProducto(producto: Producto){
    const actualItem = this.cartItems();
    const itemExistente = actualItem.find(item => item.producto.idProducto === producto.idProducto);
    const cantidadActual = itemExistente ? itemExistente.cantidad : 0;
    if(cantidadActual >= producto.stock){
      this.alertService.toast(`Stock insuficiente: ${producto.nombre}`, 'error');
      return;
    }
    if(itemExistente) {
      this.cartItems.set(actualItem.map(item =>
        item === itemExistente ? {...item, cantidad: item.cantidad + 1} : item));
    } else {
      this.cartItems.set([...actualItem, {producto, cantidad:1}]);
    }
    this.saveCart();
    this.alertService.toast(`Añadido:${producto.nombre}`);
  }

  eliminarItem(id: number){
    this.cartItems.set(this.cartItems().filter(item => item.producto.idProducto !== id));
    this.saveCart();
    this.alertService.toast('Producto Eliminado');
  }

  actualizarCantidad(id: number, delta: number){
    const items = this.cartItems().map(item =>{
      if(item.producto.idProducto === id){
        const nuevaCant = Math.min(item.cantidad + delta, item.producto.stock);
        return{...item, cantidad: nuevaCant > 0 ? nuevaCant: 1};
      }
      return item;
    });
    this.cartItems.set(items);
    this.saveCart();
  }

  vaciarCarrito(){
    this.cartItems.set([]);
    this.saveCart();
  }

}
