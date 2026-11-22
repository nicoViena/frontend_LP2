import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

//Pagina de bienvenida del cliente: portada con la foto de la hacienda
@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent {}
