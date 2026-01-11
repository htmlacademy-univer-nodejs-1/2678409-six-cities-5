import 'reflect-metadata';
import { Expose, Type } from 'class-transformer';
import { UserResponseDto } from '../user/user-response.dto.js';

export class CommentResponseDto {
  @Expose()
  public id!: string;

  @Expose()
  public text!: string;

  @Expose()
  public rating!: number;

  @Expose()
  public publishedAt!: string;

  @Expose()
  @Type(() => UserResponseDto)
  public author!: UserResponseDto;
}
