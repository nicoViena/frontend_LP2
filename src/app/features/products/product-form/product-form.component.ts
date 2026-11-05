import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductoService } from '../../../core/services/producto.service';
import { AlertService } from '../../../core/service/alert.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.css'
})
export class ProductFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productoService = inject(ProductoService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private alertService = inject(AlertService);

  form: FormGroup;
  id:number | null = null;
  fotoSeleccionada: File | null = null;
  imagenInvalida = false;

  constructor(){
    this.form = this.fb.group({
      nombre : ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      descripcion : ['', [Validators.maxLength(500)]],
      categoria : ['', [Validators.maxLength(20)]],
      precio: [0, [Validators.required, Validators.min(0.01)]],
      stock: [0, [Validators.required, Validators.min(0)]]
    })
  }

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    if(this.id){
      this.productoService.getProductoById(this.id).subscribe(p =>{
        this.form.patchValue(p)
      })
    }
  }
  //validacion peso de la imagen
  onFileSelected(event:any){
    const file: File | undefined = event.target.files[0];
    //el backend acepta imagenes de hasta 1 MB
    if(file && file.size > (1024 * 1024)){
      this.alertService.error('La imagen supera 1 MB. Selecciona otra imagen');
      event.target.value = '';
      this.fotoSeleccionada = null;
      this.imagenInvalida = true;
      return;
    }
    this.fotoSeleccionada = file ?? null;
    this.imagenInvalida = false;
  }
  guardar(){
    if(this.form.invalid) return;
    if(this.imagenInvalida){
      this.alertService.error('La imagen supera 1 MB. Selecciona otra imagen');
      return;
    }
    //un producto nuevo necesita imagen; al editar se conserva la actual
    if(!this.id && !this.fotoSeleccionada){
      this.alertService.error('Selecciona una imagen para el producto');
      return;
    }
    const formData = new FormData();
    formData.append('nombre', this.form.value.nombre);
    formData.append('descripcion', this.form.value.descripcion ?? '');
    formData.append('categoria', this.form.value.categoria ?? '');
    formData.append('precio', this.form.value.precio);
    formData.append('stock', this.form.value.stock);

    if(this.fotoSeleccionada){
      formData.append('file', this.fotoSeleccionada)
    }
    const request = this.id
    ? this.productoService.actualizarProducto(this.id, formData)
    : this.productoService.crearProducto(formData)
    request.subscribe({
      next:() =>{
        this.alertService.success(this.id ? 'Producto Actualizado':'Producto Creado');
        this.router.navigate(['/productos']);
      }, error:(err)=> {
        if(err.status === 413){
          this.alertService.error('La imagen es demasiado pesada. El tamaño máximo permitido es 1 MB');
        } else {
          this.alertService.error(err.error?.mensaje ?? 'Ocurrio un error al guardar');
        }
      }
    })
  }
}
