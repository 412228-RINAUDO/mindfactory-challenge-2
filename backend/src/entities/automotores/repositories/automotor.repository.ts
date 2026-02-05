import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Automotor } from '../entities/automotor.entity';
import { AutomotorListResponseDto } from '../dto/automotor-list-response.dto';
import {
  IAutomotorRepository,
  AutomotorDetailRaw,
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
}
