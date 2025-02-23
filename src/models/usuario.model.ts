import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUsuario extends Document {
  email: string;
  password: string;
  nombre: string;
  apellidos: string;
  tipo: string;
  estado: string;
  escuelaId: mongoose.Types.ObjectId;
  permisos: string[];
  perfil: {
    telefono?: string;
    direccion?: string;
    foto?: string;
  };
  compararPassword(candidatePassword: string): Promise<boolean>;
}

const UsuarioSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'El email es requerido'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'La contraseña es requerida'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    },
    nombre: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true,
    },
    apellidos: {
      type: String,
      required: [true, 'Los apellidos son requeridos'],
      trim: true,
    },
    tipo: {
      type: String,
      enum: ['ADMIN', 'DOCENTE', 'PADRE', 'ESTUDIANTE'],
      required: [true, 'El tipo de usuario es requerido'],
    },
    estado: {
      type: String,
      enum: ['ACTIVO', 'INACTIVO'],
      default: 'ACTIVO',
    },
    escuelaId: {
      type: Schema.Types.ObjectId,
      ref: 'Escuela',
      required: [true, 'La escuela es requerida'],
    },
    permisos: [
      {
        type: String,
      },
    ],
    perfil: {
      telefono: String,
      direccion: String,
      foto: String,
    },
  },
  {
    timestamps: true,
  },
);

// Middleware para encriptar contraseña antes de guardar
UsuarioSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Método para comparar contraseñas
UsuarioSchema.methods.compararPassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const Usuario = mongoose.model<IUsuario>('Usuario', UsuarioSchema);

export default Usuario;
