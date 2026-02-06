import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AutomotorDetailRaw } from '../interfaces/automotor-repository.interface';

export class DuenoResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '20123456789', description: 'CUIT del dueño' })
  cuit: string;

  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre o razón social' })
  denominacion: string;

  @ApiProperty({
    example: 100,
    description: 'Porcentaje de titularidad',
  })
  porcentaje: number;
}

export class AutomotorDetailResponseDto {
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

  @ApiPropertyOptional({
    name: 'dueno_actual',
    type: DuenoResponseDto,
    description: 'Dueño actual del vehículo',
  })
  duenoActual: DuenoResponseDto | null;

  constructor(data: AutomotorDetailRaw) {
    this.id = data.id;
    this.dominio = data.dominio;
    this.numeroChasis = data.numeroChasis;
    this.numeroMotor = data.numeroMotor;
    this.color = data.color;
    this.fechaFabricacion = data.fechaFabricacion;
    this.fechaAltaRegistro = data.fechaAltaRegistro;
    this.duenoActual =
      data.duenoId !== null
        ? {
            id: data.duenoId,
            cuit: data.duenoCuit!,
            denominacion: data.duenoDenominacion!,
            porcentaje: data.duenoPorcentaje!,
          }
        : null;
  }
}
