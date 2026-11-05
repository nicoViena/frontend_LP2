import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  public autor:any={
    nombre:'Hacienda',
    apellido:'Vimalu',
    anio:'2026'
  }
}
