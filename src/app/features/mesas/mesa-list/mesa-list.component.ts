import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MesaService } from '../../../core/services/mesa.service';
import { SalonService } from '../../../core/services/salon.service';
import { AlertService } from '../../../core/service/alert.service';
import { MesaNueva, SalonNuevo } from '../../../core/interfaces/salon-mesa.interface';
import { MesaFormComponent } from '../mesa-form/mesa-form.component';

@Component({
  selector: 'app-mesa-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MesaFormComponent],
  templateUrl: './mesa-list.component.html',
  styleUrl: './mesa-list.component.css'
})
export class MesaListComponent implements OnInit {
  private mesaService = inject(MesaService);
  private salonService = inject(SalonService);
  private alertService = inject(AlertService);

  mesas: MesaNueva[] = [];
  salones: SalonNuevo[] = [];
  cargando = true;
  errorCarga = false;
  filtroSalon: number | null = null;

  //modales
  detalle: MesaNueva | null = null;
  formularioAbierto = false;
  enEdicion: MesaNueva | null = null;

  ngOnInit(): void {
    this.cargarMesas();
    this.salonService.listarSalones().subscribe({
      next:(data)=> this.salones = data,
      error:()=> this.salones = []
    });
  }

  //GET /api/mesas: se vuelve a llamar despues de guardar o eliminar
  cargarMesas(){
    this.mesaService.listarMesas().subscribe({
      next:(data)=>{
        this.mesas = data;
        this.cargando = false;
        this.errorCarga = false;
      },
      error:()=>{
        this.cargando = false;
        this.errorCarga = true;
      }
    });
  }

  mesasFiltradas(){
    return this.filtroSalon === null ? this.mesas : this.mesas.filter(m => m.idSalon === this.filtroSalon);
  }

  nombreSalon(idSalon: number | null){
    if(idSalon === null) return 'Sin asignar';
    return this.salones.find(s => s.idSalon === idSalon)?.nombre ?? `Salón ${idSalon}`;
  }

  nuevo(){
    this.enEdicion = null;
    this.formularioAbierto = true;
  }

  editar(m: MesaNueva){
    this.detalle = null;
    this.enEdicion = m;
    this.formularioAbierto = true;
  }

  //el formulario avisa que guardo: se cierra el modal y se recarga el listado
  guardado(){
    this.formularioAbierto = false;
    this.cargarMesas();
  }

  //DELETE /api/mesas/{id}: el backend no permite borrar una mesa con reservas
  async eliminar(m: MesaNueva){
    const confirmado = await this.alertService.confirm(`Se eliminará la mesa "${m.nombre}". Esta acción no se puede deshacer`);
    if(!confirmado) return;
    this.mesaService.eliminarMesa(m.idMesa!).subscribe({
      next:()=>{
        this.alertService.toast('Mesa eliminada');
        this.cargarMesas();
      },
      error:(err)=> this.alertService.error(err.error?.mensaje ?? 'No se pudo eliminar la mesa')
    });
  }
}
