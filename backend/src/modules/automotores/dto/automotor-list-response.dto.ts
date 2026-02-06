import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AutomotorListResponseDto {
  @ApiProperty({ example: 'AA123BB', description: 'Dominio/Patente del vehículo' })
  dominio: string;

  @ApiProperty({
    name: 'fecha_fabricacion',
    example: 202401,
    description: 'Fecha de fabricación en formato AAAAMM',
  })
  fechaFabricacion: number;

  @ApiPropertyOptional({ example: '20123456789', description: 'CUIT del dueño' })
  cuit: string | null;

  @ApiPropertyOptional({ example: 'Juan Pérez', description: 'Denominación del dueño' })
  dueno: string | null;
}
