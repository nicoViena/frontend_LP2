import { Component, Input } from '@angular/core';

//Barra de progreso del proceso de reserva del cliente.
//paso: 1 Datos, 2 Fecha y hora, 3 Productos, 4 Pago (5 = todo completado)
@Component({
  selector: 'app-pasos-reserva',
  standalone: true,
  templateUrl: './pasos-reserva.component.html',
  styleUrl: './pasos-reserva.component.css'
})
export class PasosReservaComponent {
  @Input() paso = 1;
  pasos = ['Datos', 'Fecha y hora', 'Productos', 'Pago'];
}
