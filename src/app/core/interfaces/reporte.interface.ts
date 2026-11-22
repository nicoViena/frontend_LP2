//agrupaciones que acepta SP_REPORTE_VENTAS_PERIODOS
export type Agrupacion = 'DIA' | 'SEMANA' | 'MES';

//fila de SP_RANKING_PRODUCTOS_VENDIDOS
export interface ProductoVendido{
    idProducto: number;
    producto: string;
    unidadesVendidas: number;
    ingresos: number;
}

//fila de GET /api/reportes/estados (consulta SQL sobre RESERVA)
export interface EstadoReservaCantidad{
    estado: string;
    cantidad: number;
}

//fila de GET /api/reportes/clientes-mas-reservas (PERSONA y RESERVA)
export interface ClienteReservas{
    idPersona: number;
    nombre: string;
    totalReservas: number;
}

//fila de SP_REPORTE_VENTAS_PERIODOS
export interface VentaPeriodo{
    periodo: string;
    reservasTerminadas: number;
    ingresosTotales: number;
    promedioVenta: number;
}
