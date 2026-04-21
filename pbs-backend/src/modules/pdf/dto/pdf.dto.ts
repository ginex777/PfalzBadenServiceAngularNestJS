import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateRechnungPdfDto {
  @IsInt()
  @Min(1)
  rechnung_id!: number;
}

export class CreateAngebotPdfDto {
  @IsInt()
  @Min(1)
  angebot_id!: number;
}

export class CreateEuerPdfDto {
  @IsInt()
  @Min(2000)
  jahr!: number;

  @IsObject()
  ergebnis!: object;
}

export class CreateHausmeisterEinsatzPdfDto {
  @IsInt()
  @Min(1)
  einsatz_id!: number;
}

export class CreateHausmeisterMonatsnachweisPdfDto {
  @IsString()
  @IsNotEmpty()
  monat!: string;

  @IsOptional()
  @IsString()
  mitarbeiter_name?: string;
}

export class CreateMitarbeiterAbrechnungPdfDto {
  @IsInt()
  @Min(1)
  mitarbeiter_id!: number;
}

