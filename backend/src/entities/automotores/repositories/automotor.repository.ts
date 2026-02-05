import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Automotor } from '../entities/automotor.entity';
import { IAutomotorRepository } from '../interfaces/automotor-repository.interface';

@Injectable()
export class AutomotorRepository implements IAutomotorRepository {
  constructor(
    @InjectRepository(Automotor)
    private readonly repository: Repository<Automotor>,
  ) {}

  async findAll(): Promise<Automotor[]> {
    return this.repository.find();
  }
}
