import { DataSource } from 'typeorm';
import { Automotor } from '../../../src/entities/automotores/entities/automotor.entity';
import { createObjetoDeValor } from './objeto-valor.factory';

let automotorCounter = 0;

export interface CreateAutomotorOptions {
  dominio?: string;
  ovpId?: number;
  numeroChasis?: string | null;
  numeroMotor?: string | null;
  color?: string | null;
  fechaFabricacion?: number;
}

export async function createAutomotor(
  dataSource: DataSource,
  options: CreateAutomotorOptions = {},
): Promise<Automotor> {
  automotorCounter++;
  const repo = dataSource.getRepository(Automotor);

  // If no ovpId provided, create an ObjetoDeValor automatically
  let ovpId = options.ovpId;
  if (!ovpId) {
    const dominio = options.dominio ?? generateDominio(automotorCounter);
    const objeto = await createObjetoDeValor(dataSource, { codigo: dominio });
    ovpId = objeto.id;
  }

  return repo.save({
    dominio: options.dominio ?? generateDominio(automotorCounter),
    ovpId,
    numeroChasis: options.numeroChasis ?? null,
    numeroMotor: options.numeroMotor ?? null,
    color: options.color ?? null,
    fechaFabricacion: options.fechaFabricacion ?? 202401,
  });
}

function generateDominio(counter: number): string {
  // Generate dominio like AA001AA, AA002AA, etc.
  const num = String(counter).padStart(3, '0');
  return `TE${num}ST`;
}

export function resetAutomotorCounter(): void {
  automotorCounter = 0;
}
