export type Rol = 'ADMIN' | 'CLIENTE';

//POST /api/v1/auth/login (pendiente en el backend)
export interface LoginRequest{
    usuario: string;
    password: string;
}

//respuesta esperada del login cuando el backend lo implemente
export interface LoginResponse{
    token: string;
    usuario: string;
    rol: Rol;
    idPersona: number;
}

//RegistroDTO del backend: POST /api/v1/auth/registro
export interface RegistroRequest{
    nombre: string;
    dni: string;
    email: string;
    telefono: string;
    usuario: string;
    password: string;
}

//UsuarioDTO que devuelve el registro
export interface UsuarioRegistrado{
    idUsuario: number;
    usuario: string;
    rol: Rol;
    idPersona: number;
}
