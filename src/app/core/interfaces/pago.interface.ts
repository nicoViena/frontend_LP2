//PagoDTO del backend
export interface Pago{
    idPago: number;
    idReserva: number;
    monto: number;
    fechaPago: string | null;
    tipoPago: string;
    comprobante: string | null;
    tipoComprobante: string | null;
    //PENDIENTE o PAGADO
    estado: string;
}
