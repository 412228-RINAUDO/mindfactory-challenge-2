import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sujeto } from '../entities/sujeto.entity';
import { ISujetoRepository } from '../interfaces/sujeto-repository.interface';

@Injectable()
export class SujetoRepository implements ISujetoRepository {
  constructor(
    @InjectRepository(Sujeto)
    private readonly repository: Repository<Sujeto>,
  ) {}

  async findByCuit(cuit: string): Promise<Sujeto | null> {
    return this.repository.findOne({ where: { cuit } });
  }
}
