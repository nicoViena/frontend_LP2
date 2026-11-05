export interface Mesa{
    idMesa?: number;
    nombre: string;
    //personas por mesa
    capacidad: number;
    //mesas libres, todavia sin asignar a un salon
    cantidad: number;
}
