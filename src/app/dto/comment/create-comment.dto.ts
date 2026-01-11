import { Expose } from 'class-transformer';
import { IsString, IsNumber, Min, Max, MinLength, MaxLength } from 'class-validator';

/**
 * DTO для создания комментария
 */
export class CreateCommentDto {
  @Expose()
  @IsString({ message: 'Текст комментария должен быть строкой' })
  @MinLength(5, { message: 'Минимальная длина текста - 5 символов' })
  @MaxLength(1024, { message: 'Максимальная длина текста - 1024 символа' })
  text!: string;

  @Expose()
  @IsNumber({}, { message: 'Оценка должна быть числом' })
  @Min(1, { message: 'Минимальная оценка - 1' })
  @Max(5, { message: 'Максимальная оценка - 5' })
  rating!: number;
}
