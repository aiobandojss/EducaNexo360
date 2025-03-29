import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { TipoUsuario, EstadoUsuario } from '../interfaces/IUsuario';

export interface IUsuario extends Document {
  email: string;
  password: string;
  nombre: string;
  apellidos: string;
  tipo: TipoUsuario;
  estado: EstadoUsuario;
  escuelaId: mongoose.Types.ObjectId;
  permisos: string[];
  perfil: {
    telefono?: string;
    direccion?: string;
    foto?: string;
  };
  info_academica?: {
    grado?: string;
    grupo?: string;
    codigo_estudiante?: string;
    estudiantes_asociados?: mongoose.Types.ObjectId[]; // Para acudientes
    asignaturas_asignadas?: {
      // Para docentes
      asignaturaId: mongoose.Types.ObjectId;
      cursoId: mongoose.Types.ObjectId;
    }[];
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
      enum: [
        'SUPER_ADMIN',
        'ADMIN',
        'DOCENTE',
        'ACUDIENTE', // Cambiado de PADRE a ACUDIENTE
        'ESTUDIANTE',
        'COORDINADOR', // Nuevo rol
        'RECTOR', // Nuevo rol
        'ADMINISTRATIVO', // Nuevo rol
      ],
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
    info_academica: {
      grado: String,
      grupo: String,
      codigo_estudiante: String,
      estudiantes_asociados: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Usuario',
        },
      ],
      asignaturas_asignadas: [
        {
          asignaturaId: {
            type: Schema.Types.ObjectId,
            ref: 'Asignatura',
          },
          cursoId: {
            type: Schema.Types.ObjectId,
            ref: 'Curso',
          },
        },
      ],
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

// Agregar índices para mejorar el rendimiento de las consultas
UsuarioSchema.index({ email: 1 });
UsuarioSchema.index({ tipo: 1 });
UsuarioSchema.index({ escuelaId: 1 });
UsuarioSchema.index({ 'info_academica.estudiantes_asociados': 1 });
UsuarioSchema.index({ 'info_academica.asignaturas_asignadas.cursoId': 1 });

const Usuario = mongoose.model<IUsuario>('Usuario', UsuarioSchema);

export default Usuario;
