import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AutomotorResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'AA123BB', description: 'Dominio/Patente del vehículo' })
  dominio: string;

  @ApiPropertyOptional({
    name: 'numero_chasis',
    example: '8AG1234567890',
    description: 'Número de chasis',
  })
  numeroChasis: string | null;

  @ApiPropertyOptional({
    name: 'numero_motor',
    example: 'MOT123456',
    description: 'Número de motor',
  })
  numeroMotor: string | null;

  @ApiPropertyOptional({ example: 'Rojo', description: 'Color del vehículo' })
  color: string | null;

  @ApiProperty({
    name: 'fecha_fabricacion',
    example: 202401,
    description: 'Fecha de fabricación en formato AAAAMM',
  })
  fechaFabricacion: number;

  @ApiProperty({
    name: 'fecha_alta_registro',
    example: '2024-01-15T00:00:00.000Z',
    description: 'Fecha de alta en el registro',
  })
  fechaAltaRegistro: Date;
}
