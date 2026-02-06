import { Sujeto } from '../entities/sujeto.entity';

export const SUJETO_REPOSITORY = Symbol('SUJETO_REPOSITORY');

export interface CreateSujetoData {
  cuit: string;
  denominacion: string;
}

export interface ISujetoRepository {
  findByCuit(cuit: string): Promise<Sujeto | null>;
  existsByCuit(cuit: string): Promise<boolean>;
  create(data: CreateSujetoData): Promise<Sujeto>;
}
