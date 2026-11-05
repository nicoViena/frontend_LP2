import { Routes } from '@angular/router';
import { MainLayoutComponent } from './shared/layout/main-layout/main-layout.component';
import { ProductListComponent } from './features/products/product-list/product-list.component';
import { ProductFormComponent } from './features/products/product-form/product-form.component';
import { ReservaComponent } from './features/reserva/reserva.component';
import { HomeComponent } from './features/home/home.component';
import { CarritoComponent } from './features/carrito/carrito.component';
import { MesaListComponent } from './features/mesas/mesa-list/mesa-list.component';
import { MesaFormComponent } from './features/mesas/mesa-form/mesa-form.component';
import { SalonListComponent } from './features/salones/salon-list/salon-list.component';
import { SalonFormComponent } from './features/salones/salon-form/salon-form.component';

export const routes: Routes = [
    {
        path:'',
        component: MainLayoutComponent,
        children:[
            {path:'', redirectTo:'reserva', pathMatch:'full'},
            {path:'reserva', component:ReservaComponent},
            {path:'catalogo', component:HomeComponent},
            {path:'carrito', component:CarritoComponent},
            {path:'productos', component:ProductListComponent},
            {path:'productos/nuevo', component:ProductFormComponent},
            {path:'productos/editar/:id', component:ProductFormComponent},
            {path:'mesas', component:MesaListComponent},
            {path:'mesas/nuevo', component:MesaFormComponent},
            {path:'mesas/editar/:id', component:MesaFormComponent},
            {path:'salones', component:SalonListComponent},
            {path:'salones/nuevo', component:SalonFormComponent},
            {path:'salones/editar/:id', component:SalonFormComponent},
        ]
    },
    {
        path:'**', redirectTo:'reserva'
    }
];
