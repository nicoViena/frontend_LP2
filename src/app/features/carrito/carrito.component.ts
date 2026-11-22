import { PasosReservaComponent } from '../../shared/pasos-reserva/pasos-reserva.component';
import { Component, inject, OnInit } from '@angular/core';
import { CartService } from '../../core/services/cart.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DatosReserva, ReservaResponseDTO } from '../../core/interfaces/reserva.interface';
import { ReservaService } from '../../core/services/reserva.service';
import { AuthService } from '../../core/services/auth.service';
import { AlertService } from '../../core/service/alert.service';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, RouterLink, PasosReservaComponent],
  templateUrl: './carrito.component.html',
  styleUrl: './carrito.component.css'
})
export class CarritoComponent implements OnInit {
  public cartService = inject(CartService);
  private reservaService = inject(ReservaService);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);

  reserva: DatosReserva | null = null;
  //evita enviar la reserva dos veces con clics repetidos
  enviando = false;
  //respuesta real del backend; se muestra como resumen de confirmacion
  confirmada: ReservaResponseDTO | null = null;
  //datos para el resumen (el carrito se limpia al confirmar)
  resumen: DatosReserva | null = null;

  ngOnInit(): void {
    //sin datos de reserva se muestra el carrito vacio
    this.reserva = this.cartService.getReserva();
  }

  //POST /api/reservas: el backend registra en una sola operacion la reserva,
  //sus detalles (descontando stock) y el pago inicial de S/ 25 en estado PENDIENTE
  confirmarReserva(){
    const reserva = this.reserva;
    if(!reserva || this.enviando) return;
    if(!reserva.idMesa){
      this.alertService.error('Elige una mesa en el formulario de reserva', 'Falta la mesa');
      return;
    }
    const idPersona = this.authService.getIdPersona();
    if(!idPersona){
      this.alertService.error('Inicia sesión nuevamente para confirmar la reserva');
      return;
    }
    this.enviando = true;
    this.reservaService.crearReserva({
      idPersona,
      idMesa: reserva.idMesa,
      fechaReserva: reserva.fechaReserva,
      horaReserva: reserva.horaReserva,
      cantidadPersonas: reserva.cantPersonas,
      motivo: reserva.motivo,
      items: this.cartService.getItems().map(item => ({
        idProducto: item.producto.idProducto!,
        cantidad: item.cantidad
      }))
    }).subscribe({
      next:(respuesta)=>{
        this.enviando = false;
        this.resumen = reserva;
        this.confirmada = respuesta;
        this.cartService.limpiarTodo();
        this.reserva = null;
        this.alertService.toast('Reserva registrada');
      },
      error:(err)=>{
        this.enviando = false;
        //mensajes del backend: mesa ocupada, capacidad insuficiente, stock insuficiente, etc.
        if(err.status === 0 || err.status >= 500){
          this.alertService.error('No se pudo conectar con el servidor. La reserva no fue registrada');
        } else {
          this.alertService.error(err.error?.mensaje ?? 'No se pudo registrar la reserva', 'Reserva no registrada');
        }
      }
    });
  }
}
