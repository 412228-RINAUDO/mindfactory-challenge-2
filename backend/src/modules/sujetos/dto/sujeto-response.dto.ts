import { ApiProperty } from '@nestjs/swagger';
import { Sujeto } from '../entities/sujeto.entity';

export class SujetoResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '20123456789', description: 'CUIT del sujeto' })
  cuit: string;

  @ApiProperty({ example: 'Juan Pérez', description: 'Denominación o razón social' })
  denominacion: string;

  @ApiProperty({ example: '2024-01-15T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T00:00:00.000Z' })
  updatedAt: Date;

  constructor(entity: Sujeto) {
    this.id = entity.id;
    this.cuit = entity.cuit;
    this.denominacion = entity.denominacion;
    this.createdAt = entity.createdAt;
    this.updatedAt = entity.updatedAt;
  }
}
