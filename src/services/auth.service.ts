import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { SignJWT, jwtVerify } from 'jose';
import { IUser } from '../models/user.entity.js';
import { TYPES } from '../core/types.js';
import { Config } from '../config/config.js';
import { Logger } from 'pino';

/**
 * Сервис для работы с JWT токенами
 */
@injectable()
export class AuthService {
  private readonly secret: Uint8Array;

  constructor(
    @inject(TYPES.Config) private readonly config: Config,
    @inject(TYPES.Logger) private readonly logger: Logger
  ) {
    const jwtSecret = this.config.get('jwtSecret') as string;
    this.secret = new TextEncoder().encode(jwtSecret);
  }

  /**
   * Создать JWT токен для пользователя
   * @param user - Пользователь
   * @returns - JWT токен
   */
  public async createToken(user: IUser): Promise<string> {
    const jwt = await new SignJWT({
      id: user._id.toString(),
      email: user.email,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(this.secret);

    return jwt;
  }

  /**
   * Проверить и декодировать JWT токен
   * @param token - JWT токен
   * @returns - Декодированные данные токена или null
   */
  public async verifyToken(token: string): Promise<{ id: string; email: string } | null> {
    try {
      const { payload } = await jwtVerify(token, this.secret);
      return {
        id: payload.id as string,
        email: payload.email as string,
      };
    } catch (error) {
      this.logger.debug({ error }, 'Ошибка при проверке токена');
      return null;
    }
  }
}
