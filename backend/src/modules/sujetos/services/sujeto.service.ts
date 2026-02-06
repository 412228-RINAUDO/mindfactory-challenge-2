import { Inject, Injectable } from '@nestjs/common';
import { SUJETO_REPOSITORY } from '../interfaces/sujeto-repository.interface';
import type {
  ISujetoRepository,
  CreateSujetoData,
} from '../interfaces/sujeto-repository.interface';
import { Sujeto } from '../entities/sujeto.entity';
import { CuitAlreadyExistsException } from '../../../common/exceptions/cuit-already-exists.exception';

@Injectable()
export class SujetoService {
  constructor(
    @Inject(SUJETO_REPOSITORY)
    private readonly sujetoRepository: ISujetoRepository,
  ) {}

  async findByCuit(cuit: string): Promise<Sujeto | null> {
    return this.sujetoRepository.findByCuit(cuit);
  }

  async create(data: CreateSujetoData): Promise<Sujeto> {
    const exists = await this.sujetoRepository.existsByCuit(data.cuit);
    if (exists) {
      throw new CuitAlreadyExistsException(data.cuit);
    }
    return this.sujetoRepository.create(data);
  }
}
