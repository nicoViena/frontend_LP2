import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  public authService = inject(AuthService);

  //opciones del menu principal (mismas rutas que ya existen)
  menu = [
    {texto: 'Dashboard', icono: 'bi-grid', ruta: '/'},
    {texto: 'Gestión de Reservas', icono: 'bi-calendar3', ruta: '/reservas'},
    {texto: 'Productos', icono: 'bi-box-seam', ruta: '/productos'},
    {texto: 'Mesas', icono: 'bi-table', ruta: '/mesas'},
    {texto: 'Salones', icono: 'bi-building', ruta: '/salones'},
    {texto: 'Reportes', icono: 'bi-bar-chart-line', ruta: '/reportes'}
  ];
}
