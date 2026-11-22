import { Routes } from '@angular/router';
import { MainLayoutComponent } from './shared/layout/main-layout/main-layout.component';
import { ProductListComponent } from './features/products/product-list/product-list.component';
import { ReservaComponent } from './features/reserva/reserva.component';
import { HomeComponent } from './features/home/home.component';
import { CarritoComponent } from './features/carrito/carrito.component';
import { MesaListComponent } from './features/mesas/mesa-list/mesa-list.component';
import { SalonListComponent } from './features/salones/salon-list/salon-list.component';
import { ReservaListComponent } from './features/reservas/reserva-list/reserva-list.component';
import { ReservaFormComponent } from './features/reservas/reserva-form/reserva-form.component';
import { ReportesComponent } from './features/reportes/reportes.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { AdminLayoutComponent } from './shared/layout/admin-layout/admin-layout.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegistroComponent } from './features/auth/registro/registro.component';
import { rolGuard } from './core/guards/rol.guard';
import { MisReservasComponent } from './features/mis-reservas/mis-reservas.component';
import { InicioComponent } from './features/inicio/inicio.component';

export const routes: Routes = [
    //autenticacion: paginas publicas sin layout
    {path:'login', component:LoginComponent},
    {path:'registro', component:RegistroComponent},
    //pantallas administrativas: sidebar sin header ni footer (solo ADMIN)
    {
        path:'',
        component: AdminLayoutComponent,
        //canActivateChild vuelve a revisar al pasar de una pagina a otra dentro del layout
        canActivate: [rolGuard(['ADMIN'])],
        canActivateChild: [rolGuard(['ADMIN'])],
        children:[
            //el Dashboard es la pagina de inicio
            {path:'', component:DashboardComponent, pathMatch:'full'},
            {path:'productos', component:ProductListComponent},
            //el registro y la edicion ahora son modales dentro del listado
            {path:'productos/nuevo', redirectTo:'productos'},
            {path:'productos/editar/:id', redirectTo:'productos'},
            {path:'reservas', component:ReservaListComponent},
            {path:'reservas/nuevo', component:ReservaFormComponent},
            {path:'reservas/editar/:id', component:ReservaFormComponent},
            {path:'reportes', component:ReportesComponent},
            //mesas y salones: agregar y editar son modales dentro del listado
            {path:'mesas', component:MesaListComponent},
            {path:'mesas/nuevo', redirectTo:'mesas'},
            {path:'mesas/editar/:id', redirectTo:'mesas'},
            {path:'salones', component:SalonListComponent},
            {path:'salones/nuevo', redirectTo:'salones'},
            {path:'salones/editar/:id', redirectTo:'salones'},
        ]
    },
    //interfaz del cliente: reserva, catalogo y carrito (solo CLIENTE)
    {
        path:'',
        component: MainLayoutComponent,
        canActivate: [rolGuard(['CLIENTE'])],
        canActivateChild: [rolGuard(['CLIENTE'])],
        children:[
            //pagina de bienvenida del cliente
            {path:'inicio', component:InicioComponent},
            {path:'reserva', component:ReservaComponent},
            {path:'catalogo', component:HomeComponent},
            {path:'carrito', component:CarritoComponent},
            //consulta de las reservas propias del cliente (solo lectura)
            {path:'mis-reservas', component:MisReservasComponent},
        ]
    },
    {
        path:'**', redirectTo:''
    }
];
