import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class SendEmailDto {
  @IsEmail()
  to!: string;

  @IsString()
  @MinLength(1)
  subject!: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  html?: string;
}
