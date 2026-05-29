import {IsEmail, IsIn, IsOptional, IsString, MaxLength} from 'class-validator';

export class CreateLeadDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsIn(['website', 'mobile'])
  source?: string;
}
