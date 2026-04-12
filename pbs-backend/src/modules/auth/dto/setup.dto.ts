import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetupDto {
  @ApiProperty({ example: 'admin@pbs.de' })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ example: 'strongPassword123' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;
}
