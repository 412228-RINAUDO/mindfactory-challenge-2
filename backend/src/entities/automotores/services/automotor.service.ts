import { Inject, Injectable } from '@nestjs/common';
import { AUTOMOTOR_REPOSITORY } from '../interfaces/automotor-repository.interface';
import type { IAutomotorRepository } from '../interfaces/automotor-repository.interface';
import { AutomotorListResponseDto } from '../dto/automotor-list-response.dto';
import { AutomotorDetailResponseDto } from '../dto/automotor-detail-response.dto';
import { EntityNotFoundException } from '../../../common/exceptions/entity-not-found.exception';
import { ErrorCodes } from '../../../common/constants/error-codes';

@Injectable()
export class AutomotorService {
  constructor(
    @Inject(AUTOMOTOR_REPOSITORY)
    private readonly automotorRepository: IAutomotorRepository,
  ) {}

  async findAll(): Promise<AutomotorListResponseDto[]> {
    return this.automotorRepository.findAll();
  }

  async findByDominio(dominio: string): Promise<AutomotorDetailResponseDto> {
    const data = await this.automotorRepository.findByDominio(dominio);

    if (!data) {
      throw new EntityNotFoundException(
        ErrorCodes.AUTOMOTOR_NOT_FOUND,
        `Automotor with dominio ${dominio} not found`,
      );
    }

    return new AutomotorDetailResponseDto(data);
  }
}
