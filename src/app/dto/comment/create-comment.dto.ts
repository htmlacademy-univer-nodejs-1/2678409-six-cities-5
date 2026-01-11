import 'reflect-metadata';
import { Expose } from 'class-transformer';
import { IsString, IsNumber, Min, Max, MinLength, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @Expose()
  @IsString({ message: 'Текст комментария должен быть строкой' })
  @MinLength(5, { message: 'Минимальная длина текста - 5 символов' })
  @MaxLength(1024, { message: 'Максимальная длина текста - 1024 символа' })
  public text!: string;

  @Expose()
  @IsNumber({}, { message: 'Рейтинг должен быть числом' })
  @Min(1, { message: 'Минимальный рейтинг - 1' })
  @Max(5, { message: 'Максимальный рейтинг - 5' })
  public rating!: number;
}
