import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { VINCULO_REPOSITORY } from '../interfaces/vinculo-repository.interface';
import type { IVinculoRepository } from '../interfaces/vinculo-repository.interface';

@Injectable()
export class VinculoService {
  constructor(
    @Inject(VINCULO_REPOSITORY)
    private readonly vinculoRepository: IVinculoRepository,
  ) {}

  async closeCurrentOwner(ovpId: number, manager: EntityManager): Promise<void> {
    return this.vinculoRepository.closeCurrentOwner(ovpId, manager);
  }

  async createOwnerLink(ovpId: number, spoId: number, manager: EntityManager): Promise<void> {
    return this.vinculoRepository.createOwnerLink(
      {
        ovpId,
        spoId,
        tipoVinculo: 'DUENO',
        porcentaje: 100,
        responsable: 'S',
      },
      manager,
    );
  }

  async reassignOwner(ovpId: number, newOwnerId: number, manager: EntityManager): Promise<void> {
    await this.closeCurrentOwner(ovpId, manager);
    await this.createOwnerLink(ovpId, newOwnerId, manager);
  }
}
