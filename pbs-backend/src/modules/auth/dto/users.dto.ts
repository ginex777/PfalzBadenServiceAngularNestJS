import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export type UserRole = 'admin' | 'readonly' | 'mitarbeiter';

const USER_ROLES: UserRole[] = ['admin', 'readonly', 'mitarbeiter'];

export class CreateUserDto {
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;

  @IsIn(USER_ROLES)
  rolle: UserRole;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  vorname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nachname?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  vorname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nachname?: string;

  @IsOptional()
  @IsIn(USER_ROLES)
  rolle?: UserRole;
}
