import { DataSource } from 'typeorm';
import { ObjetoDeValor } from '../../../src/modules/objetos-valor/entities/objeto-valor.entity';

let objetoCounter = 0;

export interface CreateObjetoDeValorOptions {
  tipo?: string;
  codigo?: string;
  descripcion?: string | null;
}

export async function createObjetoDeValor(
  dataSource: DataSource,
  options: CreateObjetoDeValorOptions = {},
): Promise<ObjetoDeValor> {
  objetoCounter++;
  const repo = dataSource.getRepository(ObjetoDeValor);

  return repo.save({
    tipo: options.tipo ?? 'AUTOMOTOR',
    codigo: options.codigo ?? `TEST${String(objetoCounter).padStart(5, '0')}`,
    descripcion: options.descripcion ?? null,
  });
}

export function resetObjetoDeValorCounter(): void {
  objetoCounter = 0;
}
