import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@pbs.de' })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ example: 'secret' })
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string;
}
