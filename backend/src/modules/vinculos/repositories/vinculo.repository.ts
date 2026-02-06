import { Injectable } from '@nestjs/common';
import { EntityManager, IsNull } from 'typeorm';
import { VinculoSujetoObjeto } from '../entities/vinculo-sujeto-objeto.entity';
import {
  IVinculoRepository,
  CreateOwnerLinkData,
} from '../interfaces/vinculo-repository.interface';

@Injectable()
export class VinculoRepository implements IVinculoRepository {
  async closeCurrentOwner(ovpId: number, manager: EntityManager): Promise<void> {
    await manager.update(
      VinculoSujetoObjeto,
      {
        ovpId,
        responsable: 'S',
        fechaFin: IsNull(),
      },
      { fechaFin: new Date() },
    );
  }

  async createOwnerLink(data: CreateOwnerLinkData, manager: EntityManager): Promise<void> {
    const entity = manager.create(VinculoSujetoObjeto, {
      ovpId: data.ovpId,
      spoId: data.spoId,
      tipoVinculo: data.tipoVinculo,
      porcentaje: data.porcentaje,
      responsable: data.responsable,
      fechaInicio: new Date(),
    });

    await manager.save(entity);
  }
}
