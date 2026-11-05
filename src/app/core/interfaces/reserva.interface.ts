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

//datos del formulario de reserva que se guardan hasta el carrito
export interface DatosReserva{
    nombre: string;
    cantPersonas: number;
    idSalon: number;
    nombreSalon: string;
    capacidadMesa: number;
    fechaReserva: string;
    horaReserva: string;
}
