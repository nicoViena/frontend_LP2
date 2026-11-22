import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { SalonService } from '../../../core/services/salon.service';
import { AlertService } from '../../../core/service/alert.service';
import { SalonNuevo } from '../../../core/interfaces/salon-mesa.interface';
import { SalonFormComponent } from '../salon-form/salon-form.component';

@Component({
  selector: 'app-salon-list',
  standalone: true,
  imports: [CommonModule, SalonFormComponent],
  templateUrl: './salon-list.component.html',
  styleUrl: './salon-list.component.css'
})
export class SalonListComponent implements OnInit {
  private salonService = inject(SalonService);
  private alertService = inject(AlertService);

  salones: SalonNuevo[] = [];
  cargando = true;
  errorCarga = false;

  //modales
  detalle: SalonNuevo | null = null;
  formularioAbierto = false;
  enEdicion: SalonNuevo | null = null;

  ngOnInit(): void {
    this.cargarSalones();
  }

  //GET /api/salones: se vuelve a llamar despues de guardar o eliminar
  cargarSalones(){
    this.salonService.listarSalones().subscribe({
      next:(data)=>{
        this.salones = data;
        this.cargando = false;
        this.errorCarga = false;
      },
      error:()=>{
        this.cargando = false;
        this.errorCarga = true;
      }
    });
  }

  nuevo(){
    this.enEdicion = null;
    this.formularioAbierto = true;
  }

  editar(s: SalonNuevo){
    this.detalle = null;
    this.enEdicion = s;
    this.formularioAbierto = true;
  }

  guardado(){
    this.formularioAbierto = false;
    this.cargarSalones();
  }

  //DELETE /api/salones/{id}: el backend no permite borrar un salon que tiene mesas
  async eliminar(s: SalonNuevo){
    const confirmado = await this.alertService.confirm(`Se eliminará el salón "${s.nombre}". Esta acción no se puede deshacer`);
    if(!confirmado) return;
    this.salonService.eliminarSalon(s.idSalon!).subscribe({
      next:()=>{
        this.alertService.toast('Salón eliminado');
        this.cargarSalones();
      },
      error:(err)=> this.alertService.error(err.error?.mensaje ?? 'No se pudo eliminar el salón')
    });
  }
}
