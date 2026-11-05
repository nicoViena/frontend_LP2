import { Component, inject, OnInit } from '@angular/core';
import { CartService } from '../../core/services/cart.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DatosReserva } from '../../core/interfaces/reserva.interface';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './carrito.component.html',
  styleUrl: './carrito.component.css'
})
export class CarritoComponent implements OnInit {
  public cartService = inject(CartService);
  reserva: DatosReserva | null = null;

  ngOnInit(): void {
    //sin datos de reserva se muestra el carrito vacio
    this.reserva = this.cartService.getReserva();
  }
}
