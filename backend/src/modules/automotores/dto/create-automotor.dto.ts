import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { IsDominio } from '../../../common/validators/is-dominio.validator';
import { IsCuit } from '../../../common/validators/is-cuit.validator';
import { IsFechaFabricacion } from '../../../common/validators/is-fecha-fabricacion.validator';

export class CreateAutomotorDto {
  @ApiProperty({
    example: 'AA123BB',
    description: 'License plate in format AAA999 or AA999AA',
  })
  @IsDominio()
  dominio: string;

  @ApiPropertyOptional({
    example: 'ABC123456789',
    description: 'Chassis number',
    maxLength: 25,
  })
  @IsOptional()
  @IsString()
  @MaxLength(25)
  numeroChasis?: string;

  @ApiPropertyOptional({
    example: 'MOT987654',
    description: 'Engine number',
    maxLength: 25,
  })
  @IsOptional()
  @IsString()
  @MaxLength(25)
  numeroMotor?: string;

  @ApiPropertyOptional({
    example: 'Rojo',
    description: 'Vehicle color',
    maxLength: 40,
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  color?: string;

  @ApiProperty({
    example: 202401,
    description: 'Manufacturing date in YYYYMM format',
  })
  @IsFechaFabricacion()
  fechaFabricacion: number;

  @ApiProperty({
    example: '20123456786',
    description: 'Owner CUIT (must exist in database)',
  })
  @IsCuit()
  cuitDueno: string;
}
