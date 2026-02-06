# PUT /automotores/:dominio Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement PUT /api/automotores/:dominio endpoint that updates an existing automotor and optionally reassigns owner, following the "services talk to services" architecture.

**Architecture:** Create SujetoService and VinculoService for cross-module communication. Refactor AutomotorService to use services instead of directly injecting other module's repositories. Add update() method with partial update support.

**Tech Stack:** NestJS 11, TypeORM, class-validator, PostgreSQL

---

## Task 1: Create SujetoService

**Files:**
- Create: `src/modules/sujetos/services/sujeto.service.ts`
- Modify: `src/modules/sujetos/sujetos.module.ts`

**Step 1: Create the service**

```typescript
// src/modules/sujetos/services/sujeto.service.ts
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
```

**Step 2: Update the module**

```typescript
// src/modules/sujetos/sujetos.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sujeto } from './entities/sujeto.entity';
import { SujetoRepository } from './repositories/sujeto.repository';
import { SUJETO_REPOSITORY } from './interfaces/sujeto-repository.interface';
import { SujetoService } from './services/sujeto.service';

@Module({
  imports: [TypeOrmModule.forFeature([Sujeto])],
  providers: [
    SujetoService,
    {
      provide: SUJETO_REPOSITORY,
      useClass: SujetoRepository,
    },
  ],
  exports: [SujetoService],
})
export class SujetosModule {}
```

**Step 3: Verify compilation**

Run: `cd backend && pnpm build`
Expected: PASS

**Step 4: Commit**

```bash
git add src/modules/sujetos/
git commit -m "feat(sujetos): add SujetoService for cross-module communication"
```

---

## Task 2: Create VinculoService

**Files:**
- Create: `src/modules/vinculos/services/vinculo.service.ts`
- Modify: `src/modules/vinculos/vinculos.module.ts`

**Step 1: Create the service**

```typescript
// src/modules/vinculos/services/vinculo.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { VINCULO_REPOSITORY } from '../interfaces/vinculo-repository.interface';
import type { IVinculoRepository } from '../interfaces/vinculo-repository.interface';

@Injectable()
export class VinculoService {
  constructor(
    @Inject(VINCULO_REPOSITORY)
    private readonly vinculoRepository: IVinculoRepository,
  ) {}

  async closeCurrentOwner(ovpId: number, manager: EntityManager): Promise<void> {
    return this.vinculoRepository.closeCurrentOwner(ovpId, manager);
  }

  async createOwnerLink(
    ovpId: number,
    spoId: number,
    manager: EntityManager,
  ): Promise<void> {
    return this.vinculoRepository.createOwnerLink(
      {
        ovpId,
        spoId,
        tipoVinculo: 'DUENO',
        porcentaje: 100,
        responsable: 'S',
      },
      manager,
    );
  }

  async reassignOwner(
    ovpId: number,
    newOwnerId: number,
    manager: EntityManager,
  ): Promise<void> {
    await this.closeCurrentOwner(ovpId, manager);
    await this.createOwnerLink(ovpId, newOwnerId, manager);
  }
}
```

**Step 2: Update the module**

```typescript
// src/modules/vinculos/vinculos.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VinculoSujetoObjeto } from './entities/vinculo-sujeto-objeto.entity';
import { VinculoRepository } from './repositories/vinculo.repository';
import { VINCULO_REPOSITORY } from './interfaces/vinculo-repository.interface';
import { VinculoService } from './services/vinculo.service';

@Module({
  imports: [TypeOrmModule.forFeature([VinculoSujetoObjeto])],
  providers: [
    VinculoService,
    {
      provide: VINCULO_REPOSITORY,
      useClass: VinculoRepository,
    },
  ],
  exports: [VinculoService],
})
export class VinculosModule {}
```

**Step 3: Verify compilation**

Run: `cd backend && pnpm build`
Expected: PASS

**Step 4: Commit**

```bash
git add src/modules/vinculos/
git commit -m "feat(vinculos): add VinculoService with reassignOwner method"
```

---

## Task 3: Refactor AutomotorService to use Services

**Files:**
- Modify: `src/modules/automotores/services/automotor.service.ts`
- Modify: `src/modules/automotores/automotores.module.ts`

**Step 1: Update the service to use SujetoService and VinculoService**

```typescript
// src/modules/automotores/services/automotor.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AUTOMOTOR_REPOSITORY } from '../interfaces/automotor-repository.interface';
import type { IAutomotorRepository } from '../interfaces/automotor-repository.interface';
import { OBJETO_VALOR_REPOSITORY } from '../../objetos-valor/interfaces/objeto-valor-repository.interface';
import type { IObjetoValorRepository } from '../../objetos-valor/interfaces/objeto-valor-repository.interface';
import { SujetoService } from '../../sujetos/services/sujeto.service';
import { VinculoService } from '../../vinculos/services/vinculo.service';
import { AutomotorListResponseDto } from '../dto/automotor-list-response.dto';
import { AutomotorDetailResponseDto } from '../dto/automotor-detail-response.dto';
import { CreateAutomotorDto } from '../dto/create-automotor.dto';
import { EntityNotFoundException } from '../../../common/exceptions/entity-not-found.exception';
import { ErrorCodes } from '../../../common/constants/error-codes';

@Injectable()
export class AutomotorService {
  constructor(
    @Inject(AUTOMOTOR_REPOSITORY)
    private readonly automotorRepository: IAutomotorRepository,
    @Inject(OBJETO_VALOR_REPOSITORY)
    private readonly objetoValorRepository: IObjetoValorRepository,
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
      const valueObject = await this.objetoValorRepository.upsert(dto.dominio, manager);

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
}
```

**Step 2: Update the module imports**

```typescript
// src/modules/automotores/automotores.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Automotor } from './entities/automotor.entity';
import { AutomotorController } from './controllers/automotor.controller';
import { AutomotorService } from './services/automotor.service';
import { AutomotorRepository } from './repositories/automotor.repository';
import { AUTOMOTOR_REPOSITORY } from './interfaces/automotor-repository.interface';
import { SujetosModule } from '../sujetos/sujetos.module';
import { ObjetosValorModule } from '../objetos-valor/objetos-valor.module';
import { VinculosModule } from '../vinculos/vinculos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Automotor]),
    SujetosModule,
    ObjetosValorModule,
    VinculosModule,
  ],
  controllers: [AutomotorController],
  providers: [
    AutomotorService,
    {
      provide: AUTOMOTOR_REPOSITORY,
      useClass: AutomotorRepository,
    },
  ],
  exports: [AutomotorService],
})
export class AutomotoresModule {}
```

**Step 3: Verify compilation**

Run: `cd backend && pnpm build`
Expected: PASS

**Step 4: Run existing tests**

Run: `cd backend && pnpm test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/modules/automotores/
git commit -m "refactor(automotores): use SujetoService and VinculoService instead of repositories"
```

---

## Task 4: Create UpdateAutomotorDto

**Files:**
- Create: `src/modules/automotores/dto/update-automotor.dto.ts`

**Step 1: Create the DTO**

```typescript
// src/modules/automotores/dto/update-automotor.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { IsCuit } from '../../../common/validators/is-cuit.validator';
import { IsFechaFabricacion } from '../../../common/validators/is-fecha-fabricacion.validator';

export class UpdateAutomotorDto {
  @ApiPropertyOptional({
    example: 'ABC123456789',
    description: 'Chassis number',
    maxLength: 25,
  })
  @IsOptional()
  @IsString()
  @MaxLength(25)
  numeroChasis?: string;

  @ApiPropertyOptional({
    example: 'MOT987654',
    description: 'Engine number',
    maxLength: 25,
  })
  @IsOptional()
  @IsString()
  @MaxLength(25)
  numeroMotor?: string;

  @ApiPropertyOptional({
    example: 'Rojo',
    description: 'Vehicle color',
    maxLength: 40,
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  color?: string;

  @ApiPropertyOptional({
    example: 202401,
    description: 'Manufacturing date in YYYYMM format',
  })
  @IsOptional()
  @IsFechaFabricacion()
  fechaFabricacion?: number;

  @ApiPropertyOptional({
    example: '20304958525',
    description: 'New owner CUIT (only if changing owner)',
  })
  @IsOptional()
  @IsCuit()
  cuitDueno?: string;
}
```

**Step 2: Verify compilation**

Run: `cd backend && pnpm build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/modules/automotores/dto/update-automotor.dto.ts
git commit -m "feat(automotores): add UpdateAutomotorDto for partial updates"
```

---

## Task 5: Add update() to Automotor Repository

**Files:**
- Modify: `src/modules/automotores/interfaces/automotor-repository.interface.ts`
- Modify: `src/modules/automotores/repositories/automotor.repository.ts`

**Step 1: Update the interface**

Add to `src/modules/automotores/interfaces/automotor-repository.interface.ts`:

```typescript
import { EntityManager } from 'typeorm';
import { AutomotorListResponseDto } from '../dto/automotor-list-response.dto';

export const AUTOMOTOR_REPOSITORY = Symbol('AUTOMOTOR_REPOSITORY');

export interface UpsertAutomotorData {
  ovpId: number;
  dominio: string;
  numeroChasis: string | null;
  numeroMotor: string | null;
  color: string | null;
  fechaFabricacion: number;
}

export interface UpdateAutomotorData {
  numeroChasis?: string;
  numeroMotor?: string;
  color?: string;
  fechaFabricacion?: number;
}

// Raw query result for detail endpoint (flat structure from JOINs)
export interface AutomotorDetailRaw {
  id: number;
  ovpId: number;
  dominio: string;
  numeroChasis: string | null;
  numeroMotor: string | null;
  color: string | null;
  fechaFabricacion: number;
  fechaAltaRegistro: Date;
  duenoId: number | null;
  duenoCuit: string | null;
  duenoDenominacion: string | null;
  duenoPorcentaje: number | null;
}

export interface IAutomotorRepository {
  findAll(): Promise<AutomotorListResponseDto[]>;
  findByDominio(dominio: string): Promise<AutomotorDetailRaw | null>;
  upsert(data: UpsertAutomotorData, manager: EntityManager): Promise<void>;
  update(dominio: string, data: UpdateAutomotorData, manager: EntityManager): Promise<void>;
}
```

**Step 2: Update the repository to include ovpId in findByDominio and add update method**

Add/modify in `src/modules/automotores/repositories/automotor.repository.ts`:

```typescript
// Add ovpId to the select in findByDominio method
.addSelect('automotor.ovpId', 'ovpId')

// Add this method to the class
async update(
  dominio: string,
  data: UpdateAutomotorData,
  manager: EntityManager,
): Promise<void> {
  const updateData: Partial<Automotor> = {};

  if (data.numeroChasis !== undefined) {
    updateData.numeroChasis = data.numeroChasis;
  }
  if (data.numeroMotor !== undefined) {
    updateData.numeroMotor = data.numeroMotor;
  }
  if (data.color !== undefined) {
    updateData.color = data.color;
  }
  if (data.fechaFabricacion !== undefined) {
    updateData.fechaFabricacion = data.fechaFabricacion;
  }

  if (Object.keys(updateData).length > 0) {
    await manager.update(Automotor, { dominio }, updateData);
  }
}
```

**Step 3: Verify compilation**

Run: `cd backend && pnpm build`
Expected: PASS

**Step 4: Commit**

```bash
git add src/modules/automotores/interfaces/ src/modules/automotores/repositories/
git commit -m "feat(automotores): add update method to repository"
```

---

## Task 6: Add update() to Automotor Service

**Files:**
- Modify: `src/modules/automotores/services/automotor.service.ts`

**Step 1: Add the update method**

Add this import at the top:
```typescript
import { UpdateAutomotorDto } from '../dto/update-automotor.dto';
```

Add this method to the service class:
```typescript
async update(
  dominio: string,
  dto: UpdateAutomotorDto,
): Promise<AutomotorDetailResponseDto> {
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
      await this.vinculoService.reassignOwner(
        existingAutomotor.ovpId,
        newOwner.id,
        manager,
      );
    }
  });

  // 4. Return updated detail
  return this.findByDominio(dominio);
}
```

**Step 2: Verify compilation**

Run: `cd backend && pnpm build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/modules/automotores/services/automotor.service.ts
git commit -m "feat(automotores): add update method to service with owner reassignment"
```

---

## Task 7: Add PUT endpoint to Controller

**Files:**
- Modify: `src/modules/automotores/controllers/automotor.controller.ts`

**Step 1: Update the controller**

```typescript
// src/modules/automotores/controllers/automotor.controller.ts
import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AutomotorService } from '../services/automotor.service';
import { AutomotorListResponseDto } from '../dto/automotor-list-response.dto';
import { AutomotorDetailResponseDto } from '../dto/automotor-detail-response.dto';
import { CreateAutomotorDto } from '../dto/create-automotor.dto';
import { UpdateAutomotorDto } from '../dto/update-automotor.dto';
import { ErrorResponseDto } from '../../../common/dto/error-response.dto';

@ApiTags('automotores')
@Controller('automotores')
export class AutomotorController {
  constructor(private readonly automotorService: AutomotorService) {}

  @Get()
  @ApiOperation({ summary: 'List all vehicles with current owner' })
  @ApiResponse({
    status: 200,
    description: 'List of vehicles with owner info',
    type: [AutomotorListResponseDto],
  })
  async findAll(): Promise<AutomotorListResponseDto[]> {
    return this.automotorService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create or update a vehicle and assign owner' })
  @ApiResponse({
    status: 201,
    description: 'Vehicle created/updated with owner assigned',
    type: AutomotorDetailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error (invalid dominio, CUIT, or fecha)',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Sujeto not found by CUIT',
    type: ErrorResponseDto,
  })
  async create(@Body() dto: CreateAutomotorDto): Promise<AutomotorDetailResponseDto> {
    return this.automotorService.create(dto);
  }

  @Put(':dominio')
  @ApiOperation({ summary: 'Update vehicle and optionally reassign owner' })
  @ApiParam({
    name: 'dominio',
    description: 'Vehicle license plate (e.g., AA123BB)',
    example: 'AA123BB',
  })
  @ApiResponse({
    status: 200,
    description: 'Vehicle updated',
    type: AutomotorDetailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error (invalid CUIT or fecha)',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Automotor or Sujeto not found',
    type: ErrorResponseDto,
  })
  async update(
    @Param('dominio') dominio: string,
    @Body() dto: UpdateAutomotorDto,
  ): Promise<AutomotorDetailResponseDto> {
    return this.automotorService.update(dominio, dto);
  }

  @Get(':dominio')
  @ApiOperation({ summary: 'Get vehicle details by license plate' })
  @ApiParam({
    name: 'dominio',
    description: 'Vehicle license plate (e.g., AA123BB)',
    example: 'AA123BB',
  })
  @ApiResponse({
    status: 200,
    description: 'Vehicle details with current owner',
    type: AutomotorDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Vehicle not found', type: ErrorResponseDto })
  async findByDominio(@Param('dominio') dominio: string): Promise<AutomotorDetailResponseDto> {
    return this.automotorService.findByDominio(dominio);
  }
}
```

**Step 2: Verify compilation**

Run: `cd backend && pnpm build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/modules/automotores/controllers/automotor.controller.ts
git commit -m "feat(automotores): add PUT endpoint to controller"
```

---

## Task 8: Run All Tests

**Step 1: Run unit tests**

Run: `cd backend && pnpm test`
Expected: All tests PASS

**Step 2: Run E2E tests**

Run: `cd backend && pnpm test:e2e`
Expected: All tests PASS

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat(api): implement PUT /automotores/:dominio endpoint

- Add SujetoService for cross-module communication
- Add VinculoService with reassignOwner method
- Refactor AutomotorService to use services instead of repositories
- Add UpdateAutomotorDto for partial updates
- Add update method to repository and service
- Only reassign owner if CUIT actually changed

Closes: PUT /api/automotores/:dominio requirement"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Create SujetoService | 2 |
| 2 | Create VinculoService | 2 |
| 3 | Refactor AutomotorService | 2 |
| 4 | Create UpdateAutomotorDto | 1 |
| 5 | Add update() to repository | 2 |
| 6 | Add update() to service | 1 |
| 7 | Add PUT endpoint | 1 |
| 8 | Run all tests | 0 |

**Total: 8 tasks, 11 files**
