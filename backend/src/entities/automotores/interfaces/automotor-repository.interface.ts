import { AutomotorListResponseDto } from '../dto/automotor-list-response.dto';

export const AUTOMOTOR_REPOSITORY = Symbol('AUTOMOTOR_REPOSITORY');

// Raw query result for detail endpoint (flat structure from JOINs)
export interface AutomotorDetailRaw {
  id: number;
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
}
