// Estructura del backend corregido (SalonDTO y MesaDTO).
// Un salon tiene muchas mesas y cada mesa pertenece a un solo salon (MESA.id_salon).
// Salon y Mesa (interfaces antiguas) se mantienen porque los usan Dashboard y Reservas.

export interface SalonNuevo{
    idSalon?: number;
    nombre: string;          // varchar2(50)
    cantidadMesas?: number;  // solo lectura: lo calcula el backend contando las mesas
    estado: string;          // DISPONIBLE o NO_DISPONIBLE
}

export interface MesaNueva{
    idMesa?: number;
    nombre: string;          // varchar2(50)
    capacidad: number;
    idSalon: number | null;  // FK a SALON
    //solo lectura: el backend indica si la mesa esta libre en la fecha consultada
    fecha?: string;
    disponible?: boolean;
}
