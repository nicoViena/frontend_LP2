import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { ProductoService } from '../../core/services/producto.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
public cartService = inject(CartService);
public authService = inject(AuthService);
public productoService = inject(ProductoService);
private router = inject(Router);

//el buscador solo se muestra en el catalogo
esCatalogo(){
  return this.router.url.startsWith('/catalogo');
}

//Enter o "Buscar": guarda el texto y el catalogo filtra
buscar(texto: string){
  this.productoService.busqueda.set(texto.trim());
}

limpiar(input: HTMLInputElement){
  input.value = '';
  this.productoService.busqueda.set('');
}
}
