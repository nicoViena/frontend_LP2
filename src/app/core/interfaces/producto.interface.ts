export interface Producto{
    idProducto?: number;
    nombre:string;
    descripcion:string;
    categoria:string;
    precio:number;
    stock:number;
    imagen:string | null;
}
