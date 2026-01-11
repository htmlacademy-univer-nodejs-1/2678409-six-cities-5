import { Expose } from 'class-transformer';

/**
 * DTO для ответа комментария
 */
export class CommentResponseDto {
  @Expose()
  id!: string;

  @Expose()
  text!: string;

  @Expose()
  rating!: number;

  @Expose()
  date!: string;

  @Expose()
  author!: {
    id: string;
    name: string;
    avatar: string;
  };
}
