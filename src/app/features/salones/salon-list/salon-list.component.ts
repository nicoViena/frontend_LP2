import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SalonService } from '../../../core/services/salon.service';
import { MesaService } from '../../../core/services/mesa.service';
import { Salon } from '../../../core/interfaces/salon.interface';
import { Mesa } from '../../../core/interfaces/mesa.interface';
import { AlertService } from '../../../core/service/alert.service';

@Component({
  selector: 'app-salon-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './salon-list.component.html',
  styleUrl: './salon-list.component.css'
})
export class SalonListComponent implements OnInit {
  private salonService = inject(SalonService);
  private mesaService = inject(MesaService);
  private alertService = inject(AlertService)
  salones: Salon[]=[];
  mesas: Mesa[]=[];

  ngOnInit(): void {
    this.listSalones();
  }

  listSalones(){
    this.salonService.getSalones().subscribe
    (data=> this.salones=data);
    this.mesaService.getMesas().subscribe
    (data=> this.mesas=data);
  }

  mesaDe(salon: Salon){
    return this.mesas.find(m => m.idMesa === salon.idMesa);
  }

  async eliminar(id:number){
    const confirmado = await this.alertService.confirm('Las mesas del salón volverán a quedar libres');
    if(confirmado) {
      //el backend no permite eliminar salones con reservas y responde con un mensaje
      this.salonService.eliminarSalon(id).subscribe({
        next: ()=>{
          this.alertService.toast('Salón Eliminado')
          this.listSalones()
        }, error: (err) => this.alertService.error(err.error?.mensaje ?? 'No se pudo eliminar el salón')
      });
    }
  }
}
