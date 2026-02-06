import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AUTOMOTOR_REPOSITORY } from '../interfaces/automotor-repository.interface';
import type { IAutomotorRepository } from '../interfaces/automotor-repository.interface';
import { ObjetoValorService } from '../../objetos-valor/services/objeto-valor.service';
import { SujetoService } from '../../sujetos/services/sujeto.service';
import { VinculoService } from '../../vinculos/services/vinculo.service';
import { AutomotorListResponseDto } from '../dto/automotor-list-response.dto';
import { AutomotorDetailResponseDto } from '../dto/automotor-detail-response.dto';
import { CreateAutomotorDto } from '../dto/create-automotor.dto';
import { UpdateAutomotorDto } from '../dto/update-automotor.dto';
import { EntityNotFoundException } from '../../../common/exceptions/entity-not-found.exception';
import { ErrorCodes } from '../../../common/constants/error-codes';

@Injectable()
export class AutomotorService {
  constructor(
    @Inject(AUTOMOTOR_REPOSITORY)
    private readonly automotorRepository: IAutomotorRepository,
    private readonly objetoValorService: ObjetoValorService,
    private readonly sujetoService: SujetoService,
    private readonly vinculoService: VinculoService,
    private readonly dataSource: DataSource,
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

  async create(dto: CreateAutomotorDto): Promise<AutomotorDetailResponseDto> {
    // 1. Validate Sujeto exists via SujetoService
    const owner = await this.sujetoService.findByCuit(dto.cuitDueno);
    if (!owner) {
      throw new EntityNotFoundException(
        ErrorCodes.SUJETO_NOT_FOUND,
        `Sujeto with CUIT ${dto.cuitDueno} not found`,
      );
    }

    // 2. Execute upsert in transaction
    await this.dataSource.transaction(async (manager) => {
      // 2.1 Upsert ObjetoDeValor
      const valueObject = await this.objetoValorService.upsert(dto.dominio, manager);

      // 2.2 Upsert Automotor
      await this.automotorRepository.upsert(
        {
          ovpId: valueObject.id,
          dominio: dto.dominio,
          numeroChasis: dto.numeroChasis ?? null,
          numeroMotor: dto.numeroMotor ?? null,
          color: dto.color ?? null,
          fechaFabricacion: dto.fechaFabricacion,
        },
        manager,
      );

      // 2.3 Reassign owner (closes previous, creates new)
      await this.vinculoService.reassignOwner(valueObject.id, owner.id, manager);
    });

    // 3. Return full detail
    return this.findByDominio(dto.dominio);
  }

  async update(dominio: string, dto: UpdateAutomotorDto): Promise<AutomotorDetailResponseDto> {
    // 1. Verify automotor exists
    const existingAutomotor = await this.automotorRepository.findByDominio(dominio);
    if (!existingAutomotor) {
      throw new EntityNotFoundException(
        ErrorCodes.AUTOMOTOR_NOT_FOUND,
        `Automotor with dominio ${dominio} not found`,
      );
    }

    // 2. If cuitDueno provided, verify sujeto exists via SujetoService
    let newOwner: { id: number; cuit: string } | null = null;
    if (dto.cuitDueno) {
      const owner = await this.sujetoService.findByCuit(dto.cuitDueno);
      if (!owner) {
        throw new EntityNotFoundException(
          ErrorCodes.SUJETO_NOT_FOUND,
          `Sujeto with CUIT ${dto.cuitDueno} not found`,
        );
      }
      newOwner = owner;
    }

    // 3. Execute update in transaction
    await this.dataSource.transaction(async (manager) => {
      // 3.1 Update automotor fields (only provided ones)
      await this.automotorRepository.update(
        dominio,
        {
          numeroChasis: dto.numeroChasis,
          numeroMotor: dto.numeroMotor,
          color: dto.color,
          fechaFabricacion: dto.fechaFabricacion,
        },
        manager,
      );

      // 3.2 Reassign owner only if CUIT actually changed
      const currentOwnerCuit = existingAutomotor.duenoCuit;
      if (newOwner && newOwner.cuit !== currentOwnerCuit) {
        await this.vinculoService.reassignOwner(existingAutomotor.ovpId, newOwner.id, manager);
      }
    });

    // 4. Return updated detail
    return this.findByDominio(dominio);
  }

  async delete(dominio: string): Promise<void> {
    // 1. Find automotor to get ovpId
    const automotor = await this.automotorRepository.findByDominio(dominio);
    if (!automotor) {
      throw new EntityNotFoundException(
        ErrorCodes.AUTOMOTOR_NOT_FOUND,
        `Automotor with dominio ${dominio} not found`,
      );
    }

    // 2. Delete ObjetoDeValor (CASCADE handles Automotor and Vinculos)
    await this.objetoValorService.delete(automotor.ovpId);
  }
}
