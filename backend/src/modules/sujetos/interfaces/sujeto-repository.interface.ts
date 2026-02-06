import { Sujeto } from '../entities/sujeto.entity';

export const SUJETO_REPOSITORY = Symbol('SUJETO_REPOSITORY');

export interface ISujetoRepository {
  findByCuit(cuit: string): Promise<Sujeto | null>;
}
