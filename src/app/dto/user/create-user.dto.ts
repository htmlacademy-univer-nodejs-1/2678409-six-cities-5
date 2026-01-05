import { Expose } from 'class-transformer';

/**
 * DTO для создания нового пользователя
 */
export class CreateUserDto {
  @Expose()
  name!: string;

  @Expose()
  email!: string;

  @Expose()
  avatar?: string;

  @Expose()
  password!: string;

  @Expose()
  type!: 'pro' | 'normal';
}
