import { Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import SolicitudRegistro, { EstadoSolicitud } from '../models/solicitud-registro.model';
import Usuario from '../models/usuario.model';
import Invitacion, { TipoInvitacion } from '../models/invitacion.model';
import Curso from '../models/curso.model';
import invitacionService from './invitacion.service';
import emailService from '../services/email.service';
import ApiError from '../utils/ApiError';
import { generarPasswordAleatoria } from '../utils/passwordUtils';
import mongoose from 'mongoose';

class RegistroService {
  /**
   * Aprueba una solicitud de registro
   */
  async aprobarSolicitud(solicitudId: string, usuarioAdminId: string) {
    console.log(`Iniciando aprobación de solicitud ${solicitudId} por admin ${usuarioAdminId}`);

    const solicitud = await SolicitudRegistro.findById(solicitudId);

    if (!solicitud) {
      throw new ApiError(404, 'Solicitud no encontrada');
    }

    if (solicitud.estado !== EstadoSolicitud.PENDIENTE) {
      throw new ApiError(400, 'Esta solicitud ya ha sido procesada');
    }

    // Iniciar transacción
    const session = await SolicitudRegistro.startSession();
    session.startTransaction();

    try {
      // Generar credenciales para acudiente y estudiantes
      const acudienteCredenciales = this.generarCredencialesUnicas(
        solicitud.nombre,
        solicitud.apellidos,
        solicitud.email,
      );

      const estudiantesCredenciales = await Promise.all(
        solicitud.estudiantes.map((est) =>
          this.generarCredencialesUnicas(
            est.nombre,
            est.apellidos,
            est.email || null,
            est.codigo_estudiante || null,
          ),
        ),
      );

      console.log('Credenciales generadas con éxito');

      // 1. CREAR ACUDIENTE
      const acudiente = new Usuario({
        nombre: solicitud.nombre,
        apellidos: solicitud.apellidos,
        email: acudienteCredenciales.email,
        password: acudienteCredenciales.password,
        tipo: 'ACUDIENTE',
        estado: 'ACTIVO',
        escuelaId: solicitud.escuelaId,
        perfil: {
          telefono: solicitud.telefono || '',
          direccion: '',
          foto: '',
        },
        info_academica: {
          estudiantes_asociados: [],
          asignaturas_asignadas: [],
        },
        permisos: [],
      });

      await acudiente.save({ session });
      console.log(`Acudiente creado con ID: ${acudiente._id}`);

      // 2. CREAR ESTUDIANTES
      const estudiantes = [];
      const credencialesParaEmail = [];

      for (let i = 0; i < solicitud.estudiantes.length; i++) {
        const estData = solicitud.estudiantes[i];
        const credenciales = estudiantesCredenciales[i];

        // Obtener información del curso
        let cursoInfo = {
          grado: '',
          grupo: '',
          nombre: '',
        };

        try {
          const curso = await Curso.findById(estData.cursoId);
          if (curso) {
            cursoInfo = {
              grado: curso.grado || '',
              grupo: curso.grupo || '',
              nombre: curso.nombre || '',
            };
          }
        } catch (error) {
          console.error('Error al obtener información del curso:', error);
        }

        // Crear estudiante
        const estudiante = new Usuario({
          nombre: estData.nombre,
          apellidos: estData.apellidos,
          email: credenciales.email,
          password: credenciales.password,
          tipo: 'ESTUDIANTE',
          estado: 'ACTIVO',
          escuelaId: solicitud.escuelaId,
          perfil: {
            telefono: '',
            direccion: '',
            foto: '',
            fechaNacimiento: estData.fechaNacimiento,
          },
          info_academica: {
            codigo_estudiante: credenciales.codigo,
            grado: cursoInfo.grado,
            grupo: cursoInfo.grupo,
          },
          permisos: [],
        });

        await estudiante.save({ session });
        console.log(`Estudiante creado con ID: ${estudiante._id}`);
        estudiantes.push(estudiante);

        // Actualizar curso con addToSet para evitar duplicados
        try {
          await Curso.findByIdAndUpdate(
            estData.cursoId,
            { $addToSet: { estudiantes: estudiante._id } },
            { session, new: true },
          );
          console.log(`Estudiante añadido al curso ${estData.cursoId}`);
        } catch (error) {
          console.error('Error al añadir estudiante al curso:', error);
        }

        // Guardar credenciales para email
        credencialesParaEmail.push({
          nombre: `${estData.nombre} ${estData.apellidos}`,
          email: credenciales.email,
          password: credenciales.password,
          codigo: credenciales.codigo,
          curso: cursoInfo.nombre,
          emailGenerado: !estData.email,
        });

        // Añadir estudiante al acudiente
        acudiente.info_academica?.estudiantes_asociados?.push(
          estudiante._id as unknown as Types.ObjectId,
        );
      }

      // Actualizar acudiente con estudiantes asociados
      await acudiente.save({ session });

      // 3. Registrar uso de invitación
      await invitacionService.registrarUso(
        solicitud.invitacionId.toString(),
        (acudiente._id as unknown as Types.ObjectId).toString(),
        'ACUDIENTE',
      );

      // 4. Actualizar solicitud
      solicitud.estado = EstadoSolicitud.APROBADA;
      solicitud.fechaRevision = new Date();
      solicitud.revisadoPor = new Types.ObjectId(usuarioAdminId);
      solicitud.usuariosCreados = [
        acudiente._id as unknown as Types.ObjectId,
        ...estudiantes.map((est) => est._id as unknown as Types.ObjectId),
      ];

      await solicitud.save({ session });

      // Confirmar transacción
      await session.commitTransaction();
      console.log('Transacción completada exitosamente');

      // 5. Enviar email con credenciales
      await this.enviarCorreoConfirmacion(
        acudienteCredenciales.email,
        `${solicitud.nombre} ${solicitud.apellidos}`,
        acudienteCredenciales.password,
        credencialesParaEmail,
      );

      return {
        mensaje: 'Solicitud aprobada exitosamente',
        acudienteId: acudiente._id,
        estudiantesIds: estudiantes.map((est) => est._id),
      };
    } catch (error) {
      // Revertir transacción
      await session.abortTransaction();

      // Analizar y registrar detalles del error para depuración
      let errorMessage = 'Error al aprobar solicitud';

      if (error instanceof Error) {
        console.error('Error detallado:', error.message);

        // Si es un error de MongoDB E11000 (duplicidad)
        if (error.message.includes('E11000 duplicate key error')) {
          const campo = error.message.includes('email')
            ? 'email'
            : error.message.includes('codigo_estudiante')
            ? 'código de estudiante'
            : 'un campo único';

          errorMessage = `Error de duplicación en ${campo}. Por favor, contacte al administrador del sistema.`;
        }
      }

      throw new ApiError(500, errorMessage);
    } finally {
      session.endSession();
    }
  }

  /**
   * Genera credenciales únicas para un usuario
   */
  private generarCredencialesUnicas(
    nombre: string,
    apellidos: string,
    emailOriginal: string | null = null,
    codigoOriginal: string | null = null,
  ) {
    // Generar un UUID único para garantizar unicidad
    const uuid = uuidv4().substring(0, 8);
    const timestamp = Date.now().toString().substring(8, 13);

    // Normalizar nombre y apellidos
    const nombreNormalizado = nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '');

    const apellidoNormalizado = apellidos
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '');

    // Email: usar el original o generar uno único
    const email =
      emailOriginal ||
      `${nombreNormalizado}.${apellidoNormalizado}.${uuid}@estudiante.educanexo.com`;

    // Generar contraseña aleatoria
    const password = generarPasswordAleatoria();

    // Código: usar el original o generar uno único
    const codigo =
      codigoOriginal ||
      `EST${nombre.charAt(0).toUpperCase()}${apellidos.charAt(0).toUpperCase()}${timestamp}${uuid}`;

    return {
      email,
      password,
      codigo,
    };
  }

  /**
   * Envía correo de confirmación con credenciales
   */
  private async enviarCorreoConfirmacion(
    email: string,
    nombreCompleto: string,
    passwordAcudiente: string,
    credencialesEstudiantes: Array<{
      nombre: string;
      email: string;
      password: string;
      codigo: string;
      curso?: string;
      emailGenerado?: boolean;
    }>,
  ) {
    // Construir lista de estudiantes para el correo
    let listaEstudiantes = '';

    credencialesEstudiantes.forEach((est) => {
      listaEstudiantes += `
- Estudiante: ${est.nombre}
  Código: ${est.codigo}
  Curso: ${est.curso || 'No especificado'}
  Email: ${est.email}${est.emailGenerado ? ' (generado por el sistema)' : ''}
  Contraseña: ${est.password}
      `;
    });

    // Enviar correo con las credenciales - Ajusta según tu implementación real
    await emailService.sendEmail({
      to: email,
      subject: 'Bienvenido a EducaNexo360 - Confirmación de registro',
      text: `¡Bienvenido/a ${nombreCompleto} a EducaNexo360!

Su solicitud de registro ha sido aprobada. A continuación encontrará las credenciales de acceso para usted y sus estudiantes asociados:

SUS CREDENCIALES DE ACUDIENTE:
- Email: ${email}
- Contraseña: ${passwordAcudiente}

CREDENCIALES DE ESTUDIANTES:
${listaEstudiantes}

Por favor, conserve estas credenciales en un lugar seguro y cámbielas en su primer inicio de sesión.

Puede acceder al sistema a través de nuestra plataforma web o aplicación móvil.

Saludos cordiales,
El equipo de EducaNexo360`,
    });
  }

  /* Resto de métodos (crearSolicitud, rechazarSolicitud, etc.) */
  // ...

  /**
   * Crea una nueva solicitud de registro
   */
  async crearSolicitud(data: {
    invitacionId: string;
    nombre: string;
    apellidos: string;
    email: string;
    telefono?: string;
    estudiantes: Array<{
      nombre: string;
      apellidos: string;
      fechaNacimiento?: Date;
      cursoId: string;
      codigo_estudiante?: string;
      email?: string; // Campo opcional
    }>;
  }) {
    // Validar la invitación
    const invitacion = await Invitacion.findById(data.invitacionId);

    if (!invitacion || invitacion.estado !== 'ACTIVO') {
      throw new ApiError(400, 'La invitación no es válida o ha expirado');
    }

    // Verificar si ya existe un usuario con ese email
    const usuarioExistente = await Usuario.findOne({ email: data.email });

    if (usuarioExistente) {
      throw new ApiError(400, 'Ya existe un usuario con ese correo electrónico');
    }

    // Verificar si ya existe una solicitud pendiente con ese email
    const solicitudExistente = await SolicitudRegistro.findOne({
      email: data.email,
      estado: EstadoSolicitud.PENDIENTE,
    });

    if (solicitudExistente) {
      throw new ApiError(
        400,
        'Ya existe una solicitud de registro pendiente con ese correo electrónico',
      );
    }

    // Verificar que los emails de estudiantes (si se proporcionan) no estén en uso
    for (const estudiante of data.estudiantes) {
      if (estudiante.email) {
        const estudianteExistente = await Usuario.findOne({ email: estudiante.email });
        if (estudianteExistente) {
          throw new ApiError(400, `El correo ${estudiante.email} ya está en uso por otro usuario`);
        }
      }
    }

    // Crear la solicitud
    const solicitud = new SolicitudRegistro({
      invitacionId: new Types.ObjectId(data.invitacionId),
      escuelaId: invitacion.escuelaId,
      nombre: data.nombre,
      apellidos: data.apellidos,
      email: data.email,
      telefono: data.telefono,
      estudiantes: data.estudiantes.map((est) => ({
        ...est,
        cursoId: new Types.ObjectId(est.cursoId),
      })),
      estado: EstadoSolicitud.PENDIENTE,
      fechaSolicitud: new Date(),
    });

    await solicitud.save();

    // Enviar notificación a administradores
    await this.notificarNuevaSolicitud(solicitud);

    return solicitud;
  }

  /**
   * Notifica a los administradores sobre una nueva solicitud
   */
  private async notificarNuevaSolicitud(solicitud: any) {
    // Buscar administradores de la escuela
    const administradores = await Usuario.find({
      escuelaId: solicitud.escuelaId,
      tipo: { $in: ['ADMIN', 'RECTOR', 'COORDINADOR'] },
    });

    if (administradores.length > 0) {
      // Obtener emails de los administradores
      const emailsAdmins = administradores.map((admin) => admin.email);

      // Enviar notificación por email - Ajusta según tu implementación real
      await emailService.sendEmail({
        to: emailsAdmins,
        subject: 'Nueva solicitud de registro en EducaNexo360',
        text: `Se ha recibido una nueva solicitud de registro en el sistema EducaNexo360.
                
Detalles de la solicitud:
- Solicitante: ${solicitud.nombre} ${solicitud.apellidos}
- Email: ${solicitud.email}
- Estudiantes asociados: ${solicitud.estudiantes.length}

Por favor, revise y apruebe o rechace esta solicitud desde el panel de administración.`,
      });
    }
  }

  /**
   * Rechaza una solicitud de registro
   */
  async rechazarSolicitud(solicitudId: string, usuarioAdminId: string, motivo: string) {
    const solicitud = await SolicitudRegistro.findById(solicitudId);

    if (!solicitud) {
      throw new ApiError(404, 'Solicitud no encontrada');
    }

    if (solicitud.estado !== EstadoSolicitud.PENDIENTE) {
      throw new ApiError(400, 'Esta solicitud ya ha sido procesada');
    }

    // Actualizar la solicitud
    solicitud.estado = EstadoSolicitud.RECHAZADA;
    solicitud.fechaRevision = new Date();
    solicitud.revisadoPor = new Types.ObjectId(usuarioAdminId);
    solicitud.comentarios = motivo;

    await solicitud.save();

    // Notificar al solicitante - Ajusta según tu implementación real
    await emailService.sendEmail({
      to: solicitud.email,
      subject: 'Solicitud de registro - No aprobada',
      text: `Estimado/a ${solicitud.nombre} ${solicitud.apellidos},

Su solicitud de registro en el sistema EducaNexo360 no ha sido aprobada por el siguiente motivo:

${motivo}

Si considera que esto es un error, por favor contacte directamente con la institución educativa.

Saludos cordiales,
El equipo de EducaNexo360`,
    });

    return {
      mensaje: 'Solicitud rechazada exitosamente',
    };
  }

  /**
   * Obtiene solicitudes pendientes
   */
  async obtenerSolicitudesPendientes(escuelaId: string, pagina = 1, limite = 10) {
    const skip = (pagina - 1) * limite;

    try {
      // Asegurarnos que escuelaId sea un ObjectId válido
      let escuelaIdObj;
      try {
        if (mongoose.Types.ObjectId.isValid(escuelaId)) {
          escuelaIdObj = new mongoose.Types.ObjectId(escuelaId);
        } else {
          console.warn(`escuelaId inválido: ${escuelaId}, no se aplicará filtro de escuela`);
        }
      } catch (err) {
        console.error('Error al convertir escuelaId a ObjectId:', err);
      }

      // Construimos el filtro adecuadamente
      const filtro: { estado: EstadoSolicitud; escuelaId?: mongoose.Types.ObjectId } = {
        estado: EstadoSolicitud.PENDIENTE,
      };

      // Solo agregamos filtro de escuela si tenemos un ObjectId válido
      if (escuelaIdObj) {
        filtro.escuelaId = escuelaIdObj;
      }

      console.log('Filtro usado para buscar solicitudes:', JSON.stringify(filtro));

      const total = await SolicitudRegistro.countDocuments(filtro);
      console.log(`Total de solicitudes PENDIENTES con filtro: ${total}`);

      const solicitudes = await SolicitudRegistro.find(filtro)
        .sort({ fechaSolicitud: -1 })
        .skip(skip)
        .limit(limite);

      console.log(`Solicitudes encontradas: ${solicitudes.length}`);

      return {
        total,
        pagina,
        limite,
        solicitudes,
      };
    } catch (error) {
      console.error('Error al buscar solicitudes pendientes:', error);
      // En caso de error, devolver un objeto vacío pero válido
      return {
        total: 0,
        pagina,
        limite,
        solicitudes: [],
      };
    }
  }

  /**
   * Obtiene una solicitud por ID
   */
  async obtenerSolicitudPorId(id: string) {
    const solicitud = await SolicitudRegistro.findById(id).populate(
      'revisadoPor',
      'nombre apellidos',
    );

    if (!solicitud) {
      throw new ApiError(404, 'Solicitud no encontrada');
    }

    return solicitud;
  }

  /**
   * Obtiene el historial de solicitudes
   */
  async obtenerHistorialSolicitudes(
    escuelaId: string,
    estado?: EstadoSolicitud,
    pagina = 1,
    limite = 10,
  ) {
    const skip = (pagina - 1) * limite;

    const filtro: any = {
      escuelaId: new Types.ObjectId(escuelaId),
    };

    if (estado) {
      filtro.estado = estado;
    }

    const total = await SolicitudRegistro.countDocuments(filtro);

    const solicitudes = await SolicitudRegistro.find(filtro)
      .sort({ fechaSolicitud: -1 })
      .skip(skip)
      .limit(limite)
      .populate('revisadoPor', 'nombre apellidos');

    return {
      total,
      pagina,
      limite,
      solicitudes,
    };
  }
}

export const registroService = new RegistroService();
export default registroService;
