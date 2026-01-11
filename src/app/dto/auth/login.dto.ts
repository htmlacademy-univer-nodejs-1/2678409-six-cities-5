import { Expose } from 'class-transformer';
import { IsString, IsEmail } from 'class-validator';

/**
 * DTO для входа в систему
 */
export class LoginDto {
  @Expose()
  @IsEmail({}, { message: 'Некорректный формат email' })
    email!: string;

  @Expose()
  @IsString({ message: 'Пароль должен быть строкой' })
    password!: string;
}
