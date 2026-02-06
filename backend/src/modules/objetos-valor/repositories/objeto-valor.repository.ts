import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ObjetoDeValor } from '../entities/objeto-valor.entity';
import { IObjetoValorRepository } from '../interfaces/objeto-valor-repository.interface';

@Injectable()
export class ObjetoValorRepository implements IObjetoValorRepository {
  constructor(
    @InjectRepository(ObjetoDeValor)
    private readonly repository: Repository<ObjetoDeValor>,
  ) {}

  async upsert(dominio: string, manager: EntityManager): Promise<ObjetoDeValor> {
    const existing = await manager.findOne(ObjetoDeValor, {
      where: { codigo: dominio, tipo: 'AUTOMOTOR' },
    });

    if (existing) {
      return existing;
    }

    const entity = manager.create(ObjetoDeValor, {
      tipo: 'AUTOMOTOR',
      codigo: dominio,
      descripcion: `Automotor ${dominio}`,
    });

    return manager.save(entity);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
