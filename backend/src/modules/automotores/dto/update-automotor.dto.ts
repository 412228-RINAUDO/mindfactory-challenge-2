import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { IsCuit } from '../../../common/validators/is-cuit.validator';
import { IsFechaFabricacion } from '../../../common/validators/is-fecha-fabricacion.validator';

export class UpdateAutomotorDto {
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

  @ApiPropertyOptional({
    example: 202401,
    description: 'Manufacturing date in YYYYMM format',
  })
  @IsOptional()
  @IsFechaFabricacion()
  fechaFabricacion?: number;

  @ApiPropertyOptional({
    example: '20123456786',
    description: 'New owner CUIT (only if changing owner)',
  })
  @IsOptional()
  @IsCuit()
  cuitDueno?: string;
}
