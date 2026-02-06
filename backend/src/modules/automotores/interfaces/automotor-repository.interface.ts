import { EntityManager } from 'typeorm';
import { AutomotorListResponseDto } from '../dto/automotor-list-response.dto';

export const AUTOMOTOR_REPOSITORY = Symbol('AUTOMOTOR_REPOSITORY');

export interface UpsertAutomotorData {
  ovpId: number;
  dominio: string;
  numeroChasis: string | null;
  numeroMotor: string | null;
  color: string | null;
  fechaFabricacion: number;
}

export interface UpdateAutomotorData {
  numeroChasis?: string;
  numeroMotor?: string;
  color?: string;
  fechaFabricacion?: number;
}

// Raw query result for detail endpoint (flat structure from JOINs)
export interface AutomotorDetailRaw {
  id: number;
  ovpId: number;
  dominio: string;
  numeroChasis: string | null;
  numeroMotor: string | null;
  color: string | null;
  fechaFabricacion: number;
  fechaAltaRegistro: Date;
  duenoId: number | null;
  duenoCuit: string | null;
  duenoDenominacion: string | null;
  duenoPorcentaje: number | null;
}

export interface IAutomotorRepository {
  findAll(): Promise<AutomotorListResponseDto[]>;
  findByDominio(dominio: string): Promise<AutomotorDetailRaw | null>;
  upsert(data: UpsertAutomotorData, manager: EntityManager): Promise<void>;
  update(dominio: string, data: UpdateAutomotorData, manager: EntityManager): Promise<void>;
}
