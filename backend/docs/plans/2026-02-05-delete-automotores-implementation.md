# DELETE /automotores/:dominio Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement DELETE /api/automotores/:dominio endpoint that deletes an automotor using database CASCADE.

**Architecture:** Create ObjetoValorService for cross-module communication. Delete ObjetoDeValor and let CASCADE handle Automotor and Vinculos deletion.

**Tech Stack:** NestJS 11, TypeORM, PostgreSQL

---

## Task 1: Add delete() to ObjetoValor Repository

**Files:**
- Modify: `src/modules/objetos-valor/interfaces/objeto-valor-repository.interface.ts`
- Modify: `src/modules/objetos-valor/repositories/objeto-valor.repository.ts`

**Step 1: Update the interface**

```typescript
// src/modules/objetos-valor/interfaces/objeto-valor-repository.interface.ts
import { EntityManager } from 'typeorm';
import { ObjetoDeValor } from '../entities/objeto-valor.entity';

export const OBJETO_VALOR_REPOSITORY = Symbol('OBJETO_VALOR_REPOSITORY');

export interface IObjetoValorRepository {
  upsert(dominio: string, manager: EntityManager): Promise<ObjetoDeValor>;
  delete(id: number): Promise<void>;
}
```

**Step 2: Update the repository**

```typescript
// src/modules/objetos-valor/repositories/objeto-valor.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ObjetoDeValor } from '../entities/objeto-valor.entity';
import { IObjetoValorRepository } from '../interfaces/objeto-valor-repository.interface';

@Injectable()
export class ObjetoValorRepository implements IObjetoValorRepository {
  constructor(
    @InjectRepository(ObjetoDeValor)
    private readonly repository: Repository<ObjetoDeValor>,
  ) {}

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

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
```

**Step 3: Verify compilation**

Run: `cd backend && pnpm build`
Expected: PASS

**Step 4: Commit**

```bash
git add src/modules/objetos-valor/
git commit -m "feat(objetos-valor): add delete method to repository"
```

---

## Task 2: Create ObjetoValorService

**Files:**
- Create: `src/modules/objetos-valor/services/objeto-valor.service.ts`
- Modify: `src/modules/objetos-valor/objetos-valor.module.ts`

**Step 1: Create the service**

```typescript
// src/modules/objetos-valor/services/objeto-valor.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { OBJETO_VALOR_REPOSITORY } from '../interfaces/objeto-valor-repository.interface';
import type { IObjetoValorRepository } from '../interfaces/objeto-valor-repository.interface';
import { ObjetoDeValor } from '../entities/objeto-valor.entity';

@Injectable()
export class ObjetoValorService {
  constructor(
    @Inject(OBJETO_VALOR_REPOSITORY)
    private readonly objetoValorRepository: IObjetoValorRepository,
  ) {}

  async upsert(dominio: string, manager: EntityManager): Promise<ObjetoDeValor> {
    return this.objetoValorRepository.upsert(dominio, manager);
  }

  async delete(id: number): Promise<void> {
    return this.objetoValorRepository.delete(id);
  }
}
```

**Step 2: Update the module**

```typescript
// src/modules/objetos-valor/objetos-valor.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObjetoDeValor } from './entities/objeto-valor.entity';
import { ObjetoValorRepository } from './repositories/objeto-valor.repository';
import { OBJETO_VALOR_REPOSITORY } from './interfaces/objeto-valor-repository.interface';
import { ObjetoValorService } from './services/objeto-valor.service';

@Module({
  imports: [TypeOrmModule.forFeature([ObjetoDeValor])],
  providers: [
    ObjetoValorService,
    {
      provide: OBJETO_VALOR_REPOSITORY,
      useClass: ObjetoValorRepository,
    },
  ],
  exports: [ObjetoValorService],
})
export class ObjetosValorModule {}
```

**Step 3: Verify compilation**

Run: `cd backend && pnpm build`
Expected: PASS

**Step 4: Commit**

```bash
git add src/modules/objetos-valor/
git commit -m "feat(objetos-valor): add ObjetoValorService for cross-module communication"
```

---

## Task 3: Update AutomotorService to use ObjetoValorService

**Files:**
- Modify: `src/modules/automotores/services/automotor.service.ts`

**Step 1: Update imports and constructor**

Replace the OBJETO_VALOR_REPOSITORY import with ObjetoValorService:

```typescript
// Remove this import
// import { OBJETO_VALOR_REPOSITORY } from '../../objetos-valor/interfaces/objeto-valor-repository.interface';
// import type { IObjetoValorRepository } from '../../objetos-valor/interfaces/objeto-valor-repository.interface';

// Add this import
import { ObjetoValorService } from '../../objetos-valor/services/objeto-valor.service';
```

Update constructor:
```typescript
constructor(
  @Inject(AUTOMOTOR_REPOSITORY)
  private readonly automotorRepository: IAutomotorRepository,
  private readonly objetoValorService: ObjetoValorService,
  private readonly sujetoService: SujetoService,
  private readonly vinculoService: VinculoService,
  private readonly dataSource: DataSource,
) {}
```

**Step 2: Update create() method to use service**

Change:
```typescript
const valueObject = await this.objetoValorRepository.upsert(dto.dominio, manager);
```

To:
```typescript
const valueObject = await this.objetoValorService.upsert(dto.dominio, manager);
```

**Step 3: Add delete() method**

```typescript
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
```

**Step 4: Verify compilation**

Run: `cd backend && pnpm build`
Expected: PASS

**Step 5: Commit**

```bash
git add src/modules/automotores/services/automotor.service.ts
git commit -m "feat(automotores): add delete method using ObjetoValorService"
```

---

## Task 4: Add DELETE endpoint to Controller

**Files:**
- Modify: `src/modules/automotores/controllers/automotor.controller.ts`

**Step 1: Add Delete import and endpoint**

Add to imports:
```typescript
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
```

Add endpoint (before @Get(':dominio')):
```typescript
@Delete(':dominio')
@HttpCode(HttpStatus.NO_CONTENT)
@ApiOperation({ summary: 'Delete vehicle and related entities' })
@ApiParam({
  name: 'dominio',
  description: 'Vehicle license plate (e.g., AA123BB)',
  example: 'AA123BB',
})
@ApiResponse({
  status: 204,
  description: 'Vehicle deleted successfully',
})
@ApiResponse({
  status: 404,
  description: 'Automotor not found',
  type: ErrorResponseDto,
})
async delete(@Param('dominio') dominio: string): Promise<void> {
  return this.automotorService.delete(dominio);
}
```

**Step 2: Verify compilation**

Run: `cd backend && pnpm build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/modules/automotores/controllers/automotor.controller.ts
git commit -m "feat(automotores): add DELETE endpoint to controller"
```

---

## Task 5: Run All Tests

**Step 1: Run unit tests**

Run: `cd backend && pnpm test`
Expected: All tests PASS

**Step 2: Run E2E tests**

Run: `cd backend && pnpm test:e2e`
Expected: All tests PASS

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat(api): implement DELETE /automotores/:dominio endpoint

- Add delete method to ObjetoValorRepository
- Add ObjetoValorService for cross-module communication
- Refactor AutomotorService to use ObjetoValorService
- Add delete method using CASCADE deletion
- Add DELETE endpoint to controller

Closes: DELETE /api/automotores/:dominio requirement"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Add delete() to ObjetoValor repository | 2 |
| 2 | Create ObjetoValorService | 2 |
| 3 | Update AutomotorService | 1 |
| 4 | Add DELETE endpoint | 1 |
| 5 | Run all tests | 0 |

**Total: 5 tasks, 6 files**
