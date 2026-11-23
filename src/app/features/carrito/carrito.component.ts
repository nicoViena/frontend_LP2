import { PasosReservaComponent } from '../../shared/pasos-reserva/pasos-reserva.component';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CartService } from '../../core/services/cart.service';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DatosReserva } from '../../core/interfaces/reserva.interface';
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
export class CarritoComponent implements OnInit, OnDestroy {
  public cartService = inject(CartService);
  private reservaService = inject(ReservaService);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private router = inject(Router);

  reserva: DatosReserva | null = null;
  //evita enviar la reserva dos veces con clics repetidos
  enviando = false;
  //pago de separacion de S/ 25
  medio: 'YAPE' | 'PLIN' | null = null;
  archivo: File | null = null;
  vistaPrevia: string | null = null;

  ngOnInit(): void {
    //sin datos de reserva se muestra el carrito vacio
    this.reserva = this.cartService.getReserva();
  }

  ngOnDestroy(): void {
    this.liberarVistaPrevia();
  }

  //validacion rapida en el navegador; el backend vuelve a revisar el contenido real del archivo
  elegirArchivo(input: HTMLInputElement){
    const archivo = input.files?.[0] ?? null;
    this.liberarVistaPrevia();
    this.archivo = null;
    if(!archivo) return;
    if(!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)){
      this.alertService.error('El comprobante debe ser una imagen JPG, PNG o WEBP');
      input.value = '';
      return;
    }
    if(archivo.size > 1024 * 1024){
      this.alertService.error('La imagen debe pesar hasta 1 MB');
      input.value = '';
      return;
    }
    this.archivo = archivo;
    this.vistaPrevia = URL.createObjectURL(archivo);
  }

  //POST /api/reservas (multipart): en una sola operacion el backend guarda la reserva (PENDIENTE),
  //sus productos (descontando stock), el pago de S/ 25 (POR_VERIFICAR) y el comprobante.
  //Si algo falla no se guarda nada.
  confirmarReserva(){
    const reserva = this.reserva;
    if(!reserva || this.enviando) return;
    if(!reserva.idMesa){
      this.alertService.error('Elige una mesa en el formulario de reserva', 'Falta la mesa');
      return;
    }
    if(!this.medio || !this.archivo){
      this.alertService.error('Elige Yape o Plin y adjunta la captura de tu voucher', 'Falta el voucher');
      return;
    }
    const idPersona = this.authService.getIdPersona();
    if(!idPersona){
      this.alertService.error('Inicia sesión nuevamente para confirmar la reserva');
      return;
    }
    this.enviando = true;
    this.reservaService.crearReservaConComprobante({
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
    }, this.medio, this.archivo).subscribe({
      next:()=>{
        this.enviando = false;
        this.cartService.limpiarTodo();
        this.reserva = null;
        this.alertService.success('Tu reserva quedó PENDIENTE y tu voucher será revisado por un administrador. Puedes ver el estado en Mis Reservas.', 'Reserva registrada');
        this.router.navigate(['/mis-reservas']);
      },
      error:(err)=>{
        this.enviando = false;
        //mensajes del backend: mesa ocupada, capacidad o stock insuficiente, imagen no valida, etc.
        if(err.status === 0 || err.status >= 500){
          this.alertService.error('No se pudo conectar con el servidor. La reserva no fue registrada');
        } else {
          this.alertService.error(err.error?.mensaje ?? 'No se pudo registrar la reserva', 'Reserva no registrada');
        }
      }
    });
  }

  private liberarVistaPrevia(){
    if(this.vistaPrevia) URL.revokeObjectURL(this.vistaPrevia);
    this.vistaPrevia = null;
  }
}
