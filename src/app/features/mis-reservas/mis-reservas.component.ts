import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReservaService } from '../../core/services/reserva.service';
import { MesaService } from '../../core/services/mesa.service';
import { SalonService } from '../../core/services/salon.service';
import { AuthService } from '../../core/services/auth.service';
import { AlertService } from '../../core/service/alert.service';
import { ReservaMesaDTO } from '../../core/interfaces/reserva.interface';
import { MesaNueva, SalonNuevo } from '../../core/interfaces/salon-mesa.interface';

//Consulta de las reservas del cliente autenticado (solo lectura)
@Component({
  selector: 'app-mis-reservas',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mis-reservas.component.html',
  styleUrl: './mis-reservas.component.css'
})
export class MisReservasComponent implements OnInit {
  private reservaService = inject(ReservaService);
  private mesaService = inject(MesaService);
  private salonService = inject(SalonService);
  private alertService = inject(AlertService);
  public authService = inject(AuthService);

  reservas: ReservaMesaDTO[] = [];
  mesas: MesaNueva[] = [];
  salones: SalonNuevo[] = [];
  cargando = true;
  errorCarga = false;
  //reserva abierta en el modal de detalle
  detalle: ReservaMesaDTO | null = null;

  ngOnInit(): void {
    //GET /api/reservas con el token: el backend filtra por la persona de la sesion
    this.reservaService.getMisReservas().subscribe({
      next:(data)=>{
        //por seguridad extra tambien se filtra por el idPersona de la sesion
        const idPersona = this.authService.getIdPersona();
        this.reservas = data
          .filter(r => r.idPersona === idPersona)
          .sort((a, b) => b.fechaReserva.localeCompare(a.fechaReserva));
        this.cargando = false;
      },
      error:()=>{
        this.cargando = false;
        this.errorCarga = true;
      }
    });
    //nombres de mesas y salones (endpoints publicos)
    this.mesaService.listarMesas().subscribe({next:(data)=> this.mesas = data, error:()=> this.mesas = []});
    this.salonService.listarSalones().subscribe({next:(data)=> this.salones = data, error:()=> this.salones = []});
  }

  nombreMesa(idMesa: number){
    return this.mesas.find(m => m.idMesa === idMesa)?.nombre ?? `Mesa ${idMesa}`;
  }

  nombreSalon(idMesa: number){
    const idSalon = this.mesas.find(m => m.idMesa === idMesa)?.idSalon;
    return this.salones.find(s => s.idSalon === idSalon)?.nombre ?? '-';
  }

  //color del estado con las clases de Bootstrap
  claseEstado(estado: string){
    switch(estado){
      case 'CONFIRMADO': return 'bg-success';
      case 'RECHAZADO': return 'bg-danger';
      case 'TERMINADO': return 'bg-secondary';
      default: return 'bg-warning text-dark';
    }
  }

  //GET /api/reservas/{id}: el backend valida que la reserva sea del cliente
  verDetalle(id: number){
    this.reservaService.getReservaById(id).subscribe({
      next:(r)=> this.detalle = r,
      error:(err)=> this.alertService.error(err.error?.mensaje ?? 'No se pudo consultar la reserva')
    });
  }
}
