import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MesaService } from '../../../core/services/mesa.service';
import { SalonService } from '../../../core/services/salon.service';
import { Mesa } from '../../../core/interfaces/mesa.interface';
import { Salon } from '../../../core/interfaces/salon.interface';
import { AlertService } from '../../../core/service/alert.service';

@Component({
  selector: 'app-mesa-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mesa-list.component.html',
  styleUrl: './mesa-list.component.css'
})
export class MesaListComponent implements OnInit {
  private mesaService = inject(MesaService);
  private salonService = inject(SalonService);
  private alertService = inject(AlertService)
  mesas: Mesa[]=[];
  salones: Salon[]=[];
  salonesCargados = false;

  ngOnInit(): void {
    this.listMesas();
  }

  listMesas(){
    this.mesaService.getMesas().subscribe
    (data=> this.mesas=data);
    //los salones indican que mesas ya estan asignadas
    this.salonService.getSalones().subscribe({
      next:(data)=>{
        this.salones = data;
        this.salonesCargados = true;
      },
      error:()=> this.alertService.error('No se pudieron cargar los salones')
    });
  }

  salonesDe(mesa: Mesa){
    return this.salones.filter(s => s.idMesa === mesa.idMesa);
  }

  nombresSalones(mesa: Mesa){
    return this.salonesDe(mesa).map(s => s.nombre).join(', ');
  }

  mesasAsignadas(mesa: Mesa){
    return this.salonesDe(mesa).reduce((acc, s)=> acc + s.cantidad, 0);
  }

  async eliminar(mesa: Mesa){
    //el backend no valida esta relacion: se evita borrar una mesa usada por salones
    if(!this.salonesCargados){
      this.alertService.error('No se pudo verificar si la mesa está asignada a salones');
      return;
    }
    if(this.salonesDe(mesa).length > 0){
      this.alertService.error(`Esta mesa está asignada a: ${this.nombresSalones(mesa)}. Primero cambia o elimina esos salones.`, 'No se puede eliminar');
      return;
    }
    const confirmado = await this.alertService.confirm('Esta accion no se puede deshacer');
    if(confirmado) {
      this.mesaService.eliminarMesa(mesa.idMesa!).subscribe({
        next: ()=>{
          this.alertService.toast('Mesa Eliminada')
          this.listMesas()
        }, error: (err) => this.alertService.error(err.error?.mensaje ?? 'No se pudo eliminar la mesa')
      });
    }
  }
}
