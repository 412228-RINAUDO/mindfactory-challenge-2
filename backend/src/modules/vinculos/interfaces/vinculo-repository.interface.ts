import { EntityManager } from 'typeorm';

export const VINCULO_REPOSITORY = Symbol('VINCULO_REPOSITORY');

export interface CreateOwnerLinkData {
  ovpId: number;
  spoId: number;
  tipoVinculo: string;
  porcentaje: number;
  responsable: string;
}

export interface IVinculoRepository {
  closeCurrentOwner(ovpId: number, manager: EntityManager): Promise<void>;
  createOwnerLink(data: CreateOwnerLinkData, manager: EntityManager): Promise<void>;
}
