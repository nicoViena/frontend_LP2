export interface ItemReservaDTO{
    idProducto: number;
    cantidad: number;
}

export interface SolicitudReservaDTO{
    nombre: string;
    idPersona: number;
    idSalon: number;
    fechaReserva: string;
    horaReserva: string;
    cantPersonas: number;
    motivo?: string;
    items: ItemReservaDTO[];
}

//estados del enum EstadoReserva del backend
export type EstadoReserva = 'PENDIENTE' | 'CONFIRMADO' | 'RECHAZADO' | 'TERMINADO';

//ReservaDTO del backend (lo que devuelve GET y recibe PUT)
export interface Reserva{
    idReserva?: number;
    nombre: string;
    fechaReserva: string;
    horaReserva: string;
    cantPersonas: number;
    motivo?: string | null;
    estadoReserva: EstadoReserva;
    idPersona: number;
    idSalon: number;
    //calculados por el backend
    total?: number | null;
    totalPagado?: number | null;
    saldoPendiente?: number | null;
}

//Backend corregido: la reserva se asigna a una MESA (idMesa) y usa cantidadPersonas
//ReservaDTO: lo que devuelve GET /api/reservas/{id} y recibe PUT
export interface ReservaMesaDTO{
    idReserva?: number;
    fechaReserva: string;
    horaReserva: string;
    cantidadPersonas: number;
    motivo?: string | null;
    estadoReserva: EstadoReserva;
    idPersona: number;
    idMesa: number;
    //calculados por el backend
    total?: number | null;
    totalPagado?: number | null;
    saldoPendiente?: number | null;
}

//SolicitudReservaDTO: lo que recibe POST /api/reservas
export interface SolicitudReservaMesaDTO{
    idPersona: number;
    idMesa: number;
    fechaReserva: string;
    horaReserva: string;
    cantidadPersonas: number;
    motivo?: string;
    items: ItemReservaDTO[];
}

export interface DetalleReservaDTO{
    idDetalle: number;
    idReserva: number;
    idProducto: number;
    cantidad: number;
    precioCompra: number;
    subtotal: number;
}

//respuesta del POST /api/reservas
export interface ReservaResponseDTO{
    reserva: ReservaMesaDTO;
    detalles: DetalleReservaDTO[];
}

//datos del formulario de reserva que se guardan hasta el carrito
export interface DatosReserva{
    nombre: string;
    motivo?: string;
    cantPersonas: number;
    idSalon: number;
    nombreSalon: string;
    //mesa elegida manualmente por el cliente (se enviara como idMesa)
    idMesa: number;
    nombreMesa: string;
    capacidadMesa: number;
    fechaReserva: string;
    horaReserva: string;
}
