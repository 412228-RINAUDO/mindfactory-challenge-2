import { Automotor } from '../entities/automotor.entity';

export const AUTOMOTOR_REPOSITORY = Symbol('AUTOMOTOR_REPOSITORY');

export interface IAutomotorRepository {
  findAll(): Promise<Automotor[]>;
}
