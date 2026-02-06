import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { IsCuit } from '../../../common/validators/is-cuit.validator';

export class CreateSujetoDto {
  @ApiProperty({
    example: '20123456789',
    description: 'CUIT válido (11 dígitos con dígito verificador)',
  })
  @IsCuit()
  cuit: string;

  @ApiProperty({
    example: 'Juan Pérez',
    description: 'Denominación o razón social',
    maxLength: 160,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(160)
  denominacion: string;
}
