import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../../core/services/producto.service';
import { Producto } from '../../../core/interfaces/producto.interface';
import { AlertService } from '../../../core/service/alert.service';
import { ProductFormComponent } from '../product-form/product-form.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductFormComponent],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductoService);
  private alertService = inject(AlertService)
  productos: Producto[]=[];

  //filtros
  busqueda = '';
  categoria = '';
  disponibilidad = '';

  //paginacion
  pagina = 1;
  porPagina = 8;

  //modales: detalle y formulario (producto null = nuevo)
  detalle: Producto | null = null;
  formularioAbierto = false;
  enEdicion: Producto | null = null;

  ngOnInit(): void {
    this.listProduct();
  }

  listProduct(){
    this.productService.getProductos().subscribe({
      next:(data)=> this.productos = [...data].sort((a, b) => (a.idProducto ?? 0) - (b.idProducto ?? 0)),
      error:()=> this.alertService.error('No se pudieron cargar los productos')
    });
  }

  // ---------- Tarjetas ----------
  disponibles(){ return this.productos.filter(p => p.stock > 0).length; }
  agotados(){ return this.productos.filter(p => p.stock <= 0).length; }
  stockTotal(){ return this.productos.reduce((acc, p)=> acc + (p.stock ?? 0), 0); }

  // ---------- Filtros y paginacion ----------
  categorias(){
    return [...new Set(this.productos.map(p => p.categoria).filter(c => !!c))].sort();
  }

  filtrados(){
    const texto = this.busqueda.trim().toLowerCase();
    return this.productos.filter(p =>
      (!texto || p.nombre.toLowerCase().includes(texto)) &&
      (!this.categoria || p.categoria === this.categoria) &&
      (!this.disponibilidad || (this.disponibilidad === 'DISPONIBLE') === (p.stock > 0))
    );
  }

  paginaActual(){
    const inicio = (this.pagina - 1) * this.porPagina;
    return this.filtrados().slice(inicio, inicio + this.porPagina);
  }

  totalPaginas(){
    return Math.max(1, Math.ceil(this.filtrados().length / this.porPagina));
  }

  paginas(){
    return Array.from({length: this.totalPaginas()}, (_, i) => i + 1);
  }

  //al cambiar un filtro se vuelve a la primera pagina
  filtrar(){
    this.pagina = 1;
  }

  limpiar(){
    this.busqueda = '';
    this.categoria = '';
    this.disponibilidad = '';
    this.pagina = 1;
  }

  codigo(p: Producto){
    return 'P-' + String(p.idProducto).padStart(3, '0');
  }

  // ---------- Modales ----------
  nuevo(){
    this.enEdicion = null;
    this.formularioAbierto = true;
  }

  editar(p: Producto){
    this.detalle = null;
    this.enEdicion = p;
    this.formularioAbierto = true;
  }

  cerrarFormulario(guardado: boolean){
    this.formularioAbierto = false;
    if(guardado) this.listProduct();
  }

  async eliminar(p: Producto){
    const confirmado = await this.alertService.confirm(`Se eliminará "${p.nombre}". Esta accion no se puede deshacer`);
    if(confirmado) {
      this.productService.eliminarProducto(p.idProducto!).subscribe({
        next: ()=>{
          this.alertService.toast('Producto Eliminado')
          this.listProduct()
        }, error: (err) => this.alertService.error(err.error?.mensaje ?? 'No se pudo eliminar el producto')
      });
    }
  }
}
