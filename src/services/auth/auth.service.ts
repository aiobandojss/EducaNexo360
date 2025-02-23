import Usuario from '../../models/usuario.model';
import ApiError from '../../utils/ApiError';
import { SignOptions, sign, verify } from 'jsonwebtoken';

interface JwtPayload {
  sub: string;
  tipo: string;
  escuelaId: string;
}

class AuthService {
  private generateTokens(user: any) {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      tipo: user.tipo,
      escuelaId: user.escuelaId.toString(),
    };

    const defaultAccessExpiry = '1d';
    const defaultRefreshExpiry = '7d';

    return {
      access: {
        token: sign(payload, process.env.JWT_SECRET || 'tu_jwt_secret_muy_seguro', {
          expiresIn: process.env.JWT_EXPIRES_IN || defaultAccessExpiry,
        } as SignOptions),
        expires: process.env.JWT_EXPIRES_IN || defaultAccessExpiry,
      },
      refresh: {
        token: sign(
          payload,
          process.env.REFRESH_TOKEN_SECRET || 'tu_refresh_token_secret_muy_seguro',
          {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || defaultRefreshExpiry,
          } as SignOptions,
        ),
        expires: process.env.REFRESH_TOKEN_EXPIRES_IN || defaultRefreshExpiry,
      },
    };
  }

  async login(email: string, password: string) {
    const user = await Usuario.findOne({ email });
    if (!user) {
      throw new ApiError(401, 'Credenciales inválidas');
    }

    const isPasswordMatch = await user.compararPassword(password);
    if (!isPasswordMatch) {
      throw new ApiError(401, 'Credenciales inválidas');
    }

    if (user.estado !== 'ACTIVO') {
      throw new ApiError(401, 'Usuario inactivo');
    }

    const tokens = this.generateTokens(user);

    return {
      user,
      tokens,
    };
  }

  async refreshAuth(refreshToken: string) {
    try {
      const decoded = verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET || 'tu_refresh_token_secret_muy_seguro',
      ) as JwtPayload;

      const user = await Usuario.findById(decoded.sub);
      if (!user) {
        throw new ApiError(401, 'Usuario no encontrado');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new ApiError(401, 'Por favor autentíquese nuevamente');
    }
  }

  async register(userData: {
    email: string;
    password: string;
    nombre: string;
    apellidos: string;
    tipo: string;
    escuelaId: string;
  }) {
    const existingUser = await Usuario.findOne({ email: userData.email });
    if (existingUser) {
      throw new ApiError(400, 'El email ya está registrado');
    }

    const user = await Usuario.create(userData);
    const tokens = this.generateTokens(user);

    return {
      user,
      tokens,
    };
  }
}

export default new AuthService();
