# POST /automotores Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement POST /api/automotores endpoint that creates/updates an automotor and assigns an owner by CUIT.

**Architecture:** Service orchestrates transaction with DataSource.transaction(). Each repository handles only its entity. Custom validators for dominio, CUIT, and fechaFabricacion.

**Tech Stack:** NestJS 11, TypeORM, class-validator, PostgreSQL

---

## Task 1: Create @IsDominio() Validator

**Files:**
- Create: `src/common/validators/is-dominio.validator.ts`
- Test: `src/common/validators/is-dominio.validator.spec.ts`

**Step 1: Write the test file**

```typescript
// src/common/validators/is-dominio.validator.spec.ts
import { validate } from 'class-validator';
import { IsDominio } from './is-dominio.validator';

class TestDto {
  @IsDominio()
  dominio: string;
}

describe('IsDominio', () => {
  it('should accept old format AAA999', async () => {
    const dto = new TestDto();
    dto.dominio = 'ABC123';
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should accept new format AA999AA', async () => {
    const dto = new TestDto();
    dto.dominio = 'AB123CD';
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should reject invalid format', async () => {
    const dto = new TestDto();
    dto.dominio = 'INVALID';
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.constraints?.['isDominio']).toBeDefined();
  });

  it('should reject lowercase letters', async () => {
    const dto = new TestDto();
    dto.dominio = 'abc123';
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });

  it('should reject empty string', async () => {
    const dto = new TestDto();
    dto.dominio = '';
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd backend && pnpm test -- src/common/validators/is-dominio.validator.spec.ts`
Expected: FAIL (module not found)

**Step 3: Write the validator**

```typescript
// src/common/validators/is-dominio.validator.ts
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsDominioConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    // Old format: AAA999 | New format: AA999AA
    const regex = /^[A-Z]{3}[0-9]{3}$|^[A-Z]{2}[0-9]{3}[A-Z]{2}$/;
    return regex.test(value);
  }

  defaultMessage(): string {
    return 'Dominio must be in format AAA999 or AA999AA';
  }
}

export function IsDominio(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsDominioConstraint,
    });
  };
}
```

**Step 4: Run test to verify it passes**

Run: `cd backend && pnpm test -- src/common/validators/is-dominio.validator.spec.ts`
Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/common/validators/is-dominio.validator.ts src/common/validators/is-dominio.validator.spec.ts
git commit -m "feat(validators): add @IsDominio() validator for license plate format"
```

---

## Task 2: Create @IsCuit() Validator

**Files:**
- Create: `src/common/validators/is-cuit.validator.ts`
- Test: `src/common/validators/is-cuit.validator.spec.ts`

**Step 1: Write the test file**

```typescript
// src/common/validators/is-cuit.validator.spec.ts
import { validate } from 'class-validator';
import { IsCuit } from './is-cuit.validator';

class TestDto {
  @IsCuit()
  cuit: string;
}

describe('IsCuit', () => {
  // Valid CUITs (real examples with correct check digit)
  it('should accept valid CUIT 20304958525', async () => {
    const dto = new TestDto();
    dto.cuit = '20304958525';
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should accept valid CUIT 27123456786', async () => {
    const dto = new TestDto();
    dto.cuit = '27123456786';
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should accept valid CUIT 30715116883', async () => {
    const dto = new TestDto();
    dto.cuit = '30715116883';
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  // Invalid CUITs
  it('should reject CUIT with wrong check digit', async () => {
    const dto = new TestDto();
    dto.cuit = '20304958520'; // Wrong check digit (should be 5)
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });

  it('should reject CUIT with less than 11 digits', async () => {
    const dto = new TestDto();
    dto.cuit = '2030495852';
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });

  it('should reject CUIT with more than 11 digits', async () => {
    const dto = new TestDto();
    dto.cuit = '203049585251';
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });

  it('should reject CUIT with non-numeric characters', async () => {
    const dto = new TestDto();
    dto.cuit = '20-30495852-5';
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });

  it('should reject empty string', async () => {
    const dto = new TestDto();
    dto.cuit = '';
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd backend && pnpm test -- src/common/validators/is-cuit.validator.spec.ts`
Expected: FAIL (module not found)

**Step 3: Write the validator**

```typescript
// src/common/validators/is-cuit.validator.ts
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsCuitConstraint implements ValidatorConstraintInterface {
  private readonly COEFFICIENTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

  validate(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    if (value.length !== 11) return false;
    if (!/^[0-9]{11}$/.test(value)) return false;

    // Module 11 algorithm from XML
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      const digit = parseInt(value[i]!, 10);
      sum += digit * this.COEFFICIENTS[i]!;
    }

    let checkDigit = 11 - (sum % 11);
    if (checkDigit === 11) checkDigit = 0;
    if (checkDigit === 10) checkDigit = 9;

    return checkDigit === parseInt(value[10]!, 10);
  }

  defaultMessage(): string {
    return 'CUIT is invalid';
  }
}

export function IsCuit(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCuitConstraint,
    });
  };
}
```

**Step 4: Run test to verify it passes**

Run: `cd backend && pnpm test -- src/common/validators/is-cuit.validator.spec.ts`
Expected: PASS (8 tests)

**Step 5: Commit**

```bash
git add src/common/validators/is-cuit.validator.ts src/common/validators/is-cuit.validator.spec.ts
git commit -m "feat(validators): add @IsCuit() validator with module 11 algorithm"
```

---

## Task 3: Create @IsFechaFabricacion() Validator

**Files:**
- Create: `src/common/validators/is-fecha-fabricacion.validator.ts`
- Test: `src/common/validators/is-fecha-fabricacion.validator.spec.ts`

**Step 1: Write the test file**

```typescript
// src/common/validators/is-fecha-fabricacion.validator.spec.ts
import { validate } from 'class-validator';
import { IsFechaFabricacion } from './is-fecha-fabricacion.validator';

class TestDto {
  @IsFechaFabricacion()
  fechaFabricacion: number;
}

describe('IsFechaFabricacion', () => {
  it('should accept valid YYYYMM format 202401', async () => {
    const dto = new TestDto();
    dto.fechaFabricacion = 202401;
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should accept valid YYYYMM format 202412', async () => {
    const dto = new TestDto();
    dto.fechaFabricacion = 202412;
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should accept historic date 199001', async () => {
    const dto = new TestDto();
    dto.fechaFabricacion = 199001;
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should reject month 00', async () => {
    const dto = new TestDto();
    dto.fechaFabricacion = 202400;
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });

  it('should reject month 13', async () => {
    const dto = new TestDto();
    dto.fechaFabricacion = 202413;
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });

  it('should reject future date', async () => {
    const dto = new TestDto();
    dto.fechaFabricacion = 209912; // Far future
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });

  it('should reject year before 1900', async () => {
    const dto = new TestDto();
    dto.fechaFabricacion = 189912;
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });

  it('should reject invalid length (5 digits)', async () => {
    const dto = new TestDto();
    dto.fechaFabricacion = 20241;
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });

  it('should reject invalid length (7 digits)', async () => {
    const dto = new TestDto();
    dto.fechaFabricacion = 2024011;
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd backend && pnpm test -- src/common/validators/is-fecha-fabricacion.validator.spec.ts`
Expected: FAIL (module not found)

**Step 3: Write the validator**

```typescript
// src/common/validators/is-fecha-fabricacion.validator.ts
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsFechaFabricacionConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'number') return false;

    const strValue = value.toString();
    if (strValue.length !== 6) return false;

    const year = Math.floor(value / 100);
    const month = value % 100;

    // Year must be >= 1900
    if (year < 1900) return false;

    // Month must be 1-12
    if (month < 1 || month > 12) return false;

    // Cannot be in the future
    const now = new Date();
    const currentYYYYMM = now.getFullYear() * 100 + (now.getMonth() + 1);
    if (value > currentYYYYMM) return false;

    return true;
  }

  defaultMessage(): string {
    return 'Fecha fabricacion must be in YYYYMM format, with valid month (1-12), and not in the future';
  }
}

export function IsFechaFabricacion(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsFechaFabricacionConstraint,
    });
  };
}
```

**Step 4: Run test to verify it passes**

Run: `cd backend && pnpm test -- src/common/validators/is-fecha-fabricacion.validator.spec.ts`
Expected: PASS (9 tests)

**Step 5: Commit**

```bash
git add src/common/validators/is-fecha-fabricacion.validator.ts src/common/validators/is-fecha-fabricacion.validator.spec.ts
git commit -m "feat(validators): add @IsFechaFabricacion() validator for YYYYMM format"
```

---

## Task 4: Create CreateAutomotorDto

**Files:**
- Create: `src/modules/automotores/dto/create-automotor.dto.ts`

**Step 1: Write the DTO**

```typescript
// src/modules/automotores/dto/create-automotor.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { IsDominio } from '../../../common/validators/is-dominio.validator';
import { IsCuit } from '../../../common/validators/is-cuit.validator';
import { IsFechaFabricacion } from '../../../common/validators/is-fecha-fabricacion.validator';

export class CreateAutomotorDto {
  @ApiProperty({
    example: 'AA123BB',
    description: 'License plate in format AAA999 or AA999AA',
  })
  @IsDominio()
  dominio: string;

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

  @ApiProperty({
    example: 202401,
    description: 'Manufacturing date in YYYYMM format',
  })
  @IsFechaFabricacion()
  fechaFabricacion: number;

  @ApiProperty({
    example: '20304958525',
    description: 'Owner CUIT (must exist in database)',
  })
  @IsCuit()
  cuitDueno: string;
}
```

**Step 2: Verify compilation**

Run: `cd backend && pnpm build`
Expected: PASS (no errors)

**Step 3: Commit**

```bash
git add src/modules/automotores/dto/create-automotor.dto.ts
git commit -m "feat(automotores): add CreateAutomotorDto with validations"
```

---

## Task 5: Create Sujeto Repository

**Files:**
- Create: `src/modules/sujetos/interfaces/sujeto-repository.interface.ts`
- Create: `src/modules/sujetos/repositories/sujeto.repository.ts`
- Modify: `src/modules/sujetos/sujetos.module.ts`

**Step 1: Create the interface**

```typescript
// src/modules/sujetos/interfaces/sujeto-repository.interface.ts
import { Sujeto } from '../entities/sujeto.entity';

export const SUJETO_REPOSITORY = Symbol('SUJETO_REPOSITORY');

export interface ISujetoRepository {
  findByCuit(cuit: string): Promise<Sujeto | null>;
}
```

**Step 2: Create the repository**

```typescript
// src/modules/sujetos/repositories/sujeto.repository.ts
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
```

**Step 3: Update the module**

```typescript
// src/modules/sujetos/sujetos.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sujeto } from './entities/sujeto.entity';
import { SujetoRepository } from './repositories/sujeto.repository';
import { SUJETO_REPOSITORY } from './interfaces/sujeto-repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([Sujeto])],
  providers: [
    {
      provide: SUJETO_REPOSITORY,
      useClass: SujetoRepository,
    },
  ],
  exports: [SUJETO_REPOSITORY],
})
export class SujetosModule {}
```

**Step 4: Verify compilation**

Run: `cd backend && pnpm build`
Expected: PASS

**Step 5: Commit**

```bash
git add src/modules/sujetos/
git commit -m "feat(sujetos): add repository with findByCuit method"
```

---

## Task 6: Create ObjetoDeValor Repository

**Files:**
- Create: `src/modules/objetos-valor/interfaces/objeto-valor-repository.interface.ts`
- Create: `src/modules/objetos-valor/repositories/objeto-valor.repository.ts`
- Modify: `src/modules/objetos-valor/objetos-valor.module.ts`

**Step 1: Create the interface**

```typescript
// src/modules/objetos-valor/interfaces/objeto-valor-repository.interface.ts
import { EntityManager } from 'typeorm';
import { ObjetoDeValor } from '../entities/objeto-valor.entity';

export const OBJETO_VALOR_REPOSITORY = Symbol('OBJETO_VALOR_REPOSITORY');

export interface IObjetoValorRepository {
  upsert(dominio: string, manager: EntityManager): Promise<ObjetoDeValor>;
}
```

**Step 2: Create the repository**

```typescript
// src/modules/objetos-valor/repositories/objeto-valor.repository.ts
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ObjetoDeValor } from '../entities/objeto-valor.entity';
import { IObjetoValorRepository } from '../interfaces/objeto-valor-repository.interface';

@Injectable()
export class ObjetoValorRepository implements IObjetoValorRepository {
  async upsert(dominio: string, manager: EntityManager): Promise<ObjetoDeValor> {
    const existing = await manager.findOne(ObjetoDeValor, {
      where: { codigo: dominio, tipo: 'AUTOMOTOR' },
    });

    if (existing) {
      return existing;
    }

    const entity = manager.create(ObjetoDeValor, {
      tipo: 'AUTOMOTOR',
      codigo: dominio,
      descripcion: `Automotor ${dominio}`,
    });

    return manager.save(entity);
  }
}
```

**Step 3: Update the module**

```typescript
// src/modules/objetos-valor/objetos-valor.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObjetoDeValor } from './entities/objeto-valor.entity';
import { ObjetoValorRepository } from './repositories/objeto-valor.repository';
import { OBJETO_VALOR_REPOSITORY } from './interfaces/objeto-valor-repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([ObjetoDeValor])],
  providers: [
    {
      provide: OBJETO_VALOR_REPOSITORY,
      useClass: ObjetoValorRepository,
    },
  ],
  exports: [OBJETO_VALOR_REPOSITORY],
})
export class ObjetosValorModule {}
```

**Step 4: Verify compilation**

Run: `cd backend && pnpm build`
Expected: PASS

**Step 5: Commit**

```bash
git add src/modules/objetos-valor/
git commit -m "feat(objetos-valor): add repository with upsert method"
```

---

## Task 7: Create Vinculo Repository

**Files:**
- Create: `src/modules/vinculos/interfaces/vinculo-repository.interface.ts`
- Create: `src/modules/vinculos/repositories/vinculo.repository.ts`
- Modify: `src/modules/vinculos/vinculos.module.ts`

**Step 1: Create the interface**

```typescript
// src/modules/vinculos/interfaces/vinculo-repository.interface.ts
import { EntityManager } from 'typeorm';

export const VINCULO_REPOSITORY = Symbol('VINCULO_REPOSITORY');

export interface CreateOwnerLinkData {
  ovpId: number;
  spoId: number;
  tipoVinculo: string;
  porcentaje: number;
  responsable: string;
}

export interface IVinculoRepository {
  closeCurrentOwner(ovpId: number, manager: EntityManager): Promise<void>;
  createOwnerLink(data: CreateOwnerLinkData, manager: EntityManager): Promise<void>;
}
```

**Step 2: Create the repository**

```typescript
// src/modules/vinculos/repositories/vinculo.repository.ts
import { Injectable } from '@nestjs/common';
import { EntityManager, IsNull } from 'typeorm';
import { VinculoSujetoObjeto } from '../entities/vinculo-sujeto-objeto.entity';
import {
  IVinculoRepository,
  CreateOwnerLinkData,
} from '../interfaces/vinculo-repository.interface';

@Injectable()
export class VinculoRepository implements IVinculoRepository {
  async closeCurrentOwner(ovpId: number, manager: EntityManager): Promise<void> {
    await manager.update(
      VinculoSujetoObjeto,
      {
        ovpId,
        responsable: 'S',
        fechaFin: IsNull(),
      },
      { fechaFin: new Date() },
    );
  }

  async createOwnerLink(data: CreateOwnerLinkData, manager: EntityManager): Promise<void> {
    const entity = manager.create(VinculoSujetoObjeto, {
      ovpId: data.ovpId,
      spoId: data.spoId,
      tipoVinculo: data.tipoVinculo,
      porcentaje: data.porcentaje,
      responsable: data.responsable,
      fechaInicio: new Date(),
    });

    await manager.save(entity);
  }
}
```

**Step 3: Update the module**

```typescript
// src/modules/vinculos/vinculos.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VinculoSujetoObjeto } from './entities/vinculo-sujeto-objeto.entity';
import { VinculoRepository } from './repositories/vinculo.repository';
import { VINCULO_REPOSITORY } from './interfaces/vinculo-repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([VinculoSujetoObjeto])],
  providers: [
    {
      provide: VINCULO_REPOSITORY,
      useClass: VinculoRepository,
    },
  ],
  exports: [VINCULO_REPOSITORY],
})
export class VinculosModule {}
```

**Step 4: Verify compilation**

Run: `cd backend && pnpm build`
Expected: PASS

**Step 5: Commit**

```bash
git add src/modules/vinculos/
git commit -m "feat(vinculos): add repository with closeCurrentOwner and createOwnerLink"
```

---

## Task 8: Update Automotor Repository

**Files:**
- Modify: `src/modules/automotores/interfaces/automotor-repository.interface.ts`
- Modify: `src/modules/automotores/repositories/automotor.repository.ts`

**Step 1: Update the interface**

Add to `src/modules/automotores/interfaces/automotor-repository.interface.ts`:

```typescript
import { EntityManager } from 'typeorm';

// Add this interface
export interface UpsertAutomotorData {
  ovpId: number;
  dominio: string;
  numeroChasis: string | null;
  numeroMotor: string | null;
  color: string | null;
  fechaFabricacion: number;
}

// Add to IAutomotorRepository interface
export interface IAutomotorRepository {
  findAll(): Promise<AutomotorListResponseDto[]>;
  findByDominio(dominio: string): Promise<AutomotorDetailRaw | null>;
  upsert(data: UpsertAutomotorData, manager: EntityManager): Promise<void>;
}
```

**Step 2: Update the repository implementation**

Add to `src/modules/automotores/repositories/automotor.repository.ts`:

```typescript
import { EntityManager } from 'typeorm';
import { UpsertAutomotorData } from '../interfaces/automotor-repository.interface';

// Add this method to the class
async upsert(data: UpsertAutomotorData, manager: EntityManager): Promise<void> {
  const existing = await manager.findOne(Automotor, {
    where: { dominio: data.dominio },
  });

  if (existing) {
    await manager.update(Automotor, existing.id, {
      numeroChasis: data.numeroChasis,
      numeroMotor: data.numeroMotor,
      color: data.color,
      fechaFabricacion: data.fechaFabricacion,
    });
  } else {
    const entity = manager.create(Automotor, {
      ovpId: data.ovpId,
      dominio: data.dominio,
      numeroChasis: data.numeroChasis,
      numeroMotor: data.numeroMotor,
      color: data.color,
      fechaFabricacion: data.fechaFabricacion,
    });
    await manager.save(entity);
  }
}
```

**Step 3: Verify compilation**

Run: `cd backend && pnpm build`
Expected: PASS

**Step 4: Commit**

```bash
git add src/modules/automotores/interfaces/ src/modules/automotores/repositories/
git commit -m "feat(automotores): add upsert method to repository"
```

---

## Task 9: Update Automotor Service

**Files:**
- Modify: `src/modules/automotores/services/automotor.service.ts`

**Step 1: Update the service with create method**

Replace entire file with:

```typescript
// src/modules/automotores/services/automotor.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AUTOMOTOR_REPOSITORY } from '../interfaces/automotor-repository.interface';
import type { IAutomotorRepository } from '../interfaces/automotor-repository.interface';
import { SUJETO_REPOSITORY } from '../../sujetos/interfaces/sujeto-repository.interface';
import type { ISujetoRepository } from '../../sujetos/interfaces/sujeto-repository.interface';
import { OBJETO_VALOR_REPOSITORY } from '../../objetos-valor/interfaces/objeto-valor-repository.interface';
import type { IObjetoValorRepository } from '../../objetos-valor/interfaces/objeto-valor-repository.interface';
import { VINCULO_REPOSITORY } from '../../vinculos/interfaces/vinculo-repository.interface';
import type { IVinculoRepository } from '../../vinculos/interfaces/vinculo-repository.interface';
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
    @Inject(SUJETO_REPOSITORY)
    private readonly sujetoRepository: ISujetoRepository,
    @Inject(OBJETO_VALOR_REPOSITORY)
    private readonly objetoValorRepository: IObjetoValorRepository,
    @Inject(VINCULO_REPOSITORY)
    private readonly vinculoRepository: IVinculoRepository,
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
    // 1. Validate Sujeto exists (outside transaction - read only)
    const sujeto = await this.sujetoRepository.findByCuit(dto.cuitDueno);
    if (!sujeto) {
      throw new EntityNotFoundException(
        ErrorCodes.SUJETO_NOT_FOUND,
        `No existe Sujeto con CUIT ${dto.cuitDueno}`,
      );
    }

    // 2. Execute upsert in transaction
    await this.dataSource.transaction(async (manager) => {
      // 2.1 Upsert ObjetoDeValor
      const objetoDeValor = await this.objetoValorRepository.upsert(dto.dominio, manager);

      // 2.2 Upsert Automotor
      await this.automotorRepository.upsert(
        {
          ovpId: objetoDeValor.id,
          dominio: dto.dominio,
          numeroChasis: dto.numeroChasis ?? null,
          numeroMotor: dto.numeroMotor ?? null,
          color: dto.color ?? null,
          fechaFabricacion: dto.fechaFabricacion,
        },
        manager,
      );

      // 2.3 Close previous owner link
      await this.vinculoRepository.closeCurrentOwner(objetoDeValor.id, manager);

      // 2.4 Create new owner link
      await this.vinculoRepository.createOwnerLink(
        {
          ovpId: objetoDeValor.id,
          spoId: sujeto.id,
          tipoVinculo: 'DUENO',
          porcentaje: 100,
          responsable: 'S',
        },
        manager,
      );
    });

    // 3. Return full detail
    return this.findByDominio(dto.dominio);
  }
}
```

**Step 2: Verify compilation**

Run: `cd backend && pnpm build`
Expected: FAIL (module not wired yet)

**Step 3: Commit (partial)**

```bash
git add src/modules/automotores/services/automotor.service.ts
git commit -m "feat(automotores): add create method with transaction orchestration"
```

---

## Task 10: Update Automotores Module

**Files:**
- Modify: `src/modules/automotores/automotores.module.ts`

**Step 1: Update the module to import dependencies**

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

**Step 2: Verify compilation**

Run: `cd backend && pnpm build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/modules/automotores/automotores.module.ts
git commit -m "feat(automotores): wire module dependencies for create endpoint"
```

---

## Task 11: Update Automotor Controller

**Files:**
- Modify: `src/modules/automotores/controllers/automotor.controller.ts`

**Step 1: Add POST endpoint**

```typescript
// src/modules/automotores/controllers/automotor.controller.ts
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AutomotorService } from '../services/automotor.service';
import { AutomotorListResponseDto } from '../dto/automotor-list-response.dto';
import { AutomotorDetailResponseDto } from '../dto/automotor-detail-response.dto';
import { CreateAutomotorDto } from '../dto/create-automotor.dto';
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
git commit -m "feat(automotores): add POST endpoint to controller"
```

---

## Task 12: Run All Tests

**Step 1: Run unit tests**

Run: `cd backend && pnpm test`
Expected: All tests PASS

**Step 2: Run E2E tests**

Run: `cd backend && pnpm test:e2e`
Expected: All tests PASS

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat(api): implement POST /automotores endpoint

- Add custom validators: @IsDominio, @IsCuit, @IsFechaFabricacion
- Add CreateAutomotorDto with all validations
- Add repositories for Sujeto, ObjetoDeValor, Vinculo
- Add upsert method to AutomotorRepository
- Orchestrate transaction in AutomotorService
- Wire all module dependencies

Closes: POST /api/automotores requirement"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | @IsDominio validator | 2 |
| 2 | @IsCuit validator | 2 |
| 3 | @IsFechaFabricacion validator | 2 |
| 4 | CreateAutomotorDto | 1 |
| 5 | Sujeto repository | 3 |
| 6 | ObjetoDeValor repository | 3 |
| 7 | Vinculo repository | 3 |
| 8 | Automotor repository upsert | 2 |
| 9 | Automotor service create | 1 |
| 10 | Automotores module wiring | 1 |
| 11 | Automotor controller POST | 1 |
| 12 | Run all tests | 0 |

**Total: 12 tasks, 21 files**
