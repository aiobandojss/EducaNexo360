declare namespace Express {
  export interface User {
    _id: string;
    escuelaId: string;
    tipo: string;
    email: string;
    nombre: string;
    apellidos: string;
    estado: string;
  }

  export interface Request {
    user?: User;
  }
}
