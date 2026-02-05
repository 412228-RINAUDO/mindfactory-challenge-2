import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { AUTOMOTOR_REPOSITORY } from '../interfaces/automotor-repository.interface';
import type { IAutomotorRepository } from '../interfaces/automotor-repository.interface';
import { AutomotorResponseDto } from '../dto/automotor-response.dto';

@Injectable()
export class AutomotorService {
  constructor(
    @Inject(AUTOMOTOR_REPOSITORY)
    private readonly automotorRepository: IAutomotorRepository,
  ) {}

  async findAll(): Promise<AutomotorResponseDto[]> {
    const automotores = await this.automotorRepository.findAll();

    return plainToInstance(AutomotorResponseDto, automotores);
  }
}
