import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Automotor } from '../entities/automotor.entity';
import { AutomotorListResponseDto } from '../dto/automotor-list-response.dto';
import {
  IAutomotorRepository,
  AutomotorDetailRaw,
  UpsertAutomotorData,
  UpdateAutomotorData,
} from '../interfaces/automotor-repository.interface';

@Injectable()
export class AutomotorRepository implements IAutomotorRepository {
  constructor(
    @InjectRepository(Automotor)
    private readonly repository: Repository<Automotor>,
  ) {}

  async findAll(): Promise<AutomotorListResponseDto[]> {
    return this.repository
      .createQueryBuilder('automotor')
      .select('automotor.dominio', 'dominio')
      .addSelect('automotor.fechaFabricacion', 'fechaFabricacion')
      .addSelect('sujeto.cuit', 'cuit')
      .addSelect('sujeto.denominacion', 'dueno')
      .innerJoin('automotor.objetoDeValor', 'objetoDeValor')
      .leftJoin(
        'objetoDeValor.vinculos',
        'vinculo',
        "vinculo.responsable = 'S' AND vinculo.fechaFin IS NULL",
      )
      .leftJoin('vinculo.sujeto', 'sujeto')
      .orderBy('automotor.dominio', 'ASC')
      .getRawMany<AutomotorListResponseDto>();
  }

  async findByDominio(dominio: string): Promise<AutomotorDetailRaw | null> {
    const result = await this.repository
      .createQueryBuilder('automotor')
      .select('automotor.id', 'id')
      .addSelect('automotor.ovpId', 'ovpId')
      .addSelect('automotor.dominio', 'dominio')
      .addSelect('automotor.numeroChasis', 'numeroChasis')
      .addSelect('automotor.numeroMotor', 'numeroMotor')
      .addSelect('automotor.color', 'color')
      .addSelect('automotor.fechaFabricacion', 'fechaFabricacion')
      .addSelect('automotor.fechaAltaRegistro', 'fechaAltaRegistro')
      .addSelect('sujeto.id', 'duenoId')
      .addSelect('sujeto.cuit', 'duenoCuit')
      .addSelect('sujeto.denominacion', 'duenoDenominacion')
      .addSelect('vinculo.porcentaje', 'duenoPorcentaje')
      .leftJoin('automotor.objetoDeValor', 'objetoDeValor')
      .leftJoin(
        'objetoDeValor.vinculos',
        'vinculo',
        "vinculo.responsable = 'S' AND vinculo.fechaFin IS NULL",
      )
      .leftJoin('vinculo.sujeto', 'sujeto')
      .where('automotor.dominio = :dominio', { dominio })
      .getRawOne<AutomotorDetailRaw>();

    return result ?? null;
  }

  async upsert(data: UpsertAutomotorData, manager: EntityManager): Promise<void> {
    const existing = await manager.findOne(Automotor, {
      where: { dominio: data.dominio },
    });

    if (existing) {
      await manager.update(Automotor, existing.id, {
        numeroChasis: data.numeroChasis,
        numeroMotor: data.numeroMotor,
        color: data.color,
        fechaFabricacion: data.fechaFabricacion,
      });
    } else {
      const entity = manager.create(Automotor, {
        ovpId: data.ovpId,
        dominio: data.dominio,
        numeroChasis: data.numeroChasis,
        numeroMotor: data.numeroMotor,
        color: data.color,
        fechaFabricacion: data.fechaFabricacion,
      });
      await manager.save(entity);
    }
  }

  async update(
    dominio: string,
    data: UpdateAutomotorData,
    manager: EntityManager,
  ): Promise<void> {
    const updateData: Partial<Automotor> = {};

    if (data.numeroChasis !== undefined) {
      updateData.numeroChasis = data.numeroChasis;
    }
    if (data.numeroMotor !== undefined) {
      updateData.numeroMotor = data.numeroMotor;
    }
    if (data.color !== undefined) {
      updateData.color = data.color;
    }
    if (data.fechaFabricacion !== undefined) {
      updateData.fechaFabricacion = data.fechaFabricacion;
    }

    if (Object.keys(updateData).length > 0) {
      await manager.update(Automotor, { dominio }, updateData);
    }
  }
}
