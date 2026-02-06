import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sujeto } from '../entities/sujeto.entity';
import { ISujetoRepository, CreateSujetoData } from '../interfaces/sujeto-repository.interface';

@Injectable()
export class SujetoRepository implements ISujetoRepository {
  constructor(
    @InjectRepository(Sujeto)
    private readonly repository: Repository<Sujeto>,
  ) {}

  async findByCuit(cuit: string): Promise<Sujeto | null> {
    return this.repository.findOne({ where: { cuit } });
  }

  async existsByCuit(cuit: string): Promise<boolean> {
    const count = await this.repository.count({ where: { cuit } });
    return count > 0;
  }

  async create(data: CreateSujetoData): Promise<Sujeto> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }
}
