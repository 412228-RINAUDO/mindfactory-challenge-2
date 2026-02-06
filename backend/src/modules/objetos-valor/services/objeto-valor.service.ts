import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { OBJETO_VALOR_REPOSITORY } from '../interfaces/objeto-valor-repository.interface';
import type { IObjetoValorRepository } from '../interfaces/objeto-valor-repository.interface';
import { ObjetoDeValor } from '../entities/objeto-valor.entity';

@Injectable()
export class ObjetoValorService {
  constructor(
    @Inject(OBJETO_VALOR_REPOSITORY)
    private readonly objetoValorRepository: IObjetoValorRepository,
  ) {}

  async upsert(dominio: string, manager: EntityManager): Promise<ObjetoDeValor> {
    return this.objetoValorRepository.upsert(dominio, manager);
  }

  async delete(id: number): Promise<void> {
    return this.objetoValorRepository.delete(id);
  }
}
