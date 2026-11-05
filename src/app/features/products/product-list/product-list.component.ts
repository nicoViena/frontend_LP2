import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductoService } from '../../../core/services/producto.service';
import { Producto } from '../../../core/interfaces/producto.interface';
import { AlertService } from '../../../core/service/alert.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductoService);
  private alertService = inject(AlertService)
  productos: Producto[]=[];

  ngOnInit(): void {
    this.listProduct();
  }

  listProduct(){
    this.productService.getProductos().subscribe
    (data=> this.productos=data);
  }

  async eliminar(id:number){
    const confirmado = await this.alertService.confirm('Esta accion no se puede deshacer');
    if(confirmado) {
      this.productService.eliminarProducto(id).subscribe({
        next: ()=>{
          this.alertService.toast('Producto Eliminado')
          this.listProduct()
        }, error: () => this.alertService.error('No se pudo eliminar el producto')
      });
    }
  }
}
