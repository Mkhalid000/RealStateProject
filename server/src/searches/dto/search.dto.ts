import {IsBoolean, IsOptional, IsString, MaxLength} from 'class-validator';

export class CreateSavedSearchDto {
  @IsString()
  @MaxLength(80)
  name: string;

  /** The listings query string, e.g. `city=Bhopal&type=villa&maxPrice=9000000`. */
  @IsString()
  @MaxLength(2000)
  query: string;

  @IsOptional() @IsBoolean() alertsEnabled?: boolean;
}

export class UpdateSavedSearchDto {
  @IsOptional() @IsString() @MaxLength(80) name?: string;
  @IsOptional() @IsString() @MaxLength(2000) query?: string;
  @IsOptional() @IsBoolean() alertsEnabled?: boolean;
}
