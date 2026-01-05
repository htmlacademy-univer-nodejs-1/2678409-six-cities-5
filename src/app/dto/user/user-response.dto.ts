import { Expose } from 'class-transformer';

/**
 * DTO для ответа пользователя
 */
export class UserResponseDto {
  @Expose()
  id!: string;

  @Expose()
  name!: string;

  @Expose()
  email!: string;

  @Expose()
  avatar?: string;

  @Expose()
  type!: 'pro' | 'normal';

  @Expose()
  createdAt!: string;

  @Expose()
  updatedAt!: string;
}
