import { DataSource } from 'typeorm';
import { VinculoSujetoObjeto } from '../../../src/entities/vinculos/entities/vinculo-sujeto-objeto.entity';

export interface CreateVinculoOptions {
  ovpId: number;
  spoId: number;
  tipoVinculo?: string;
  porcentaje?: number;
  responsable?: string;
  fechaInicio?: Date;
  fechaFin?: Date | null;
}

export async function createVinculo(
  dataSource: DataSource,
  options: CreateVinculoOptions,
): Promise<VinculoSujetoObjeto> {
  const repo = dataSource.getRepository(VinculoSujetoObjeto);

  return repo.save({
    ovpId: options.ovpId,
    spoId: options.spoId,
    tipoVinculo: options.tipoVinculo ?? 'DUENO',
    porcentaje: options.porcentaje ?? 100,
    responsable: options.responsable ?? 'S',
    fechaInicio: options.fechaInicio ?? new Date(),
    fechaFin: options.fechaFin ?? null,
  });
}
