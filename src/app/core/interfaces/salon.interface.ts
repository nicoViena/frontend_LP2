export interface Salon{
    idSalon: number;
    idMesa: number;
    nombre: string;
    cantidad: number;
    capacidad: number;
    estado: string;
    //solo llegan al consultar la disponibilidad por fecha
    fecha?: string | null;
    mesasOcupadas?: number | null;
    mesasDisponibles?: number | null;
    capacidadDisponible?: number | null;
}

//datos que se envian al registrar o editar; la capacidad la calcula el backend
export interface SalonRequest{
    idMesa: number;
    nombre: string;
    cantidad: number;
    estado: string;
}
