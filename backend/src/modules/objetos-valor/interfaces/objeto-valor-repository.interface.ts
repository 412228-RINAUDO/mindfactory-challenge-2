import { EntityManager } from 'typeorm';
import { ObjetoDeValor } from '../entities/objeto-valor.entity';

export const OBJETO_VALOR_REPOSITORY = Symbol('OBJETO_VALOR_REPOSITORY');

export interface IObjetoValorRepository {
  upsert(dominio: string, manager: EntityManager): Promise<ObjetoDeValor>;
  delete(id: number): Promise<void>;
}
