import { DataSource } from 'typeorm';
import { Sujeto } from '../../../src/modules/sujetos/entities/sujeto.entity';

let sujetoCounter = 0;

export interface CreateSujetoOptions {
  cuit?: string;
  denominacion?: string;
}

export async function createSujeto(
  dataSource: DataSource,
  options: CreateSujetoOptions = {},
): Promise<Sujeto> {
  sujetoCounter++;
  const repo = dataSource.getRepository(Sujeto);

  return repo.save({
    cuit: options.cuit ?? `20${String(sujetoCounter).padStart(9, '0')}`,
    denominacion: options.denominacion ?? `Test Sujeto ${sujetoCounter}`,
  });
}

export function resetSujetoCounter(): void {
  sujetoCounter = 0;
}
