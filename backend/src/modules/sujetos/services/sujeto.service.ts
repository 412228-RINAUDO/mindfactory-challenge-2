import { Inject, Injectable } from '@nestjs/common';
import { SUJETO_REPOSITORY } from '../interfaces/sujeto-repository.interface';
import type { ISujetoRepository } from '../interfaces/sujeto-repository.interface';
import { Sujeto } from '../entities/sujeto.entity';

@Injectable()
export class SujetoService {
  constructor(
    @Inject(SUJETO_REPOSITORY)
    private readonly sujetoRepository: ISujetoRepository,
  ) {}

  async findByCuit(cuit: string): Promise<Sujeto | null> {
    return this.sujetoRepository.findByCuit(cuit);
  }
}
