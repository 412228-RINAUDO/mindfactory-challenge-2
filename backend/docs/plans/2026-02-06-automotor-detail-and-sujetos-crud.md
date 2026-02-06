# Automotor Detail & Sujetos CRUD Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement endpoints for getting automotor detail by dominio, and CRUD operations for sujetos (create and get by CUIT).

**Architecture:** Extend existing layered architecture (Controller → Service → Repository) following the patterns already established in the codebase. Add a new `SujetoController` for sujetos endpoints, and add the `findByDominio` endpoint to the existing `AutomotorController`.

**Tech Stack:** NestJS 11, TypeORM, PostgreSQL, class-validator, Swagger/OpenAPI

---

## Task 1: Add GET /automotores/:dominio Endpoint

**Files:**

- Modify: `backend/src/modules/automotores/controllers/automotor.controller.ts`
- Modify: `backend/src/modules/automotores/services/automotor.service.ts`
- Modify: `backend/test/automotor.e2e-spec.ts`

### Step 1.1: Add findByDominio method to AutomotorService

Make the private `getDetailByDominio` method public and rename it to `findByDominio`:

**File:** `backend/src/modules/automotores/services/automotor.service.ts`

```typescript
// Change from private to public and rename
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
```

Update internal calls from `getDetailByDominio` to `findByDominio`.

### Step 1.2: Add GET endpoint to AutomotorController

**File:** `backend/src/modules/automotores/controllers/automotor.controller.ts`

Add between `findAll()` and `create()`:

```typescript
@Get(':dominio')
@ApiOperation({ summary: 'Get vehicle detail by license plate' })
@ApiParam({
  name: 'dominio',
  description: 'Vehicle license plate (e.g., AA123BB)',
  example: 'AA123BB',
})
@ApiResponse({
  status: 200,
  description: 'Vehicle detail with owner info',
  type: AutomotorDetailResponseDto,
})
@ApiResponse({
  status: 404,
  description: 'Automotor not found',
  type: ErrorResponseDto,
})
async findByDominio(@Param('dominio') dominio: string): Promise<AutomotorDetailResponseDto> {
  return this.automotorService.findByDominio(dominio);
}
```

### Step 1.3: Add E2E tests for GET /automotores/:dominio

**File:** `backend/test/automotor.e2e-spec.ts`

Add new describe block after `DELETE /automotores/:dominio`:

```typescript
describe('GET /automotores/:dominio', () => {
  beforeEach(async () => {
    await clearAllTables(dataSource);
  });

  it('should return vehicle detail with owner', async () => {
    const sujeto = await createSujeto(dataSource, {
      cuit: '20123456786',
      denominacion: 'Test Owner',
    });
    const auto = await createAutomotor(dataSource, {
      dominio: 'DE001AA',
      fechaFabricacion: 202401,
      numeroChasis: 'CHASIS123',
      numeroMotor: 'MOTOR123',
      color: 'Rojo',
    });
    await createVinculo(dataSource, { ovpId: auto.ovpId, spoId: sujeto.id });

    const response = await request(server).get('/automotores/DE001AA').expect(200);

    expect(response.body).toMatchObject({
      dominio: 'DE001AA',
      numeroChasis: 'CHASIS123',
      numeroMotor: 'MOTOR123',
      color: 'Rojo',
      fechaFabricacion: 202401,
      duenoActual: {
        cuit: '20123456786',
        denominacion: 'Test Owner',
        porcentaje: '100.00',
      },
    });
    expect(response.body.id).toBeDefined();
    expect(response.body.fechaAltaRegistro).toBeDefined();
  });

  it('should return vehicle without owner when no active vinculo exists', async () => {
    await createAutomotor(dataSource, {
      dominio: 'NO001OW',
      fechaFabricacion: 202401,
    });

    const response = await request(server).get('/automotores/NO001OW').expect(200);

    expect(response.body).toMatchObject({
      dominio: 'NO001OW',
      fechaFabricacion: 202401,
      duenoActual: null,
    });
  });

  it('should return 404 when vehicle does not exist', async () => {
    const response = await request(server).get('/automotores/NOTEXIST').expect(404);

    expect(response.body).toMatchObject({
      statusCode: 404,
      errorCode: 'AUTOMOTOR_NOT_FOUND',
    });
  });
});
```

### Step 1.4: Run tests to verify

Run: `cd backend && pnpm test:e2e`
Expected: All tests pass including new GET /automotores/:dominio tests

### Step 1.5: Commit

```bash
git add backend/src/modules/automotores/controllers/automotor.controller.ts backend/src/modules/automotores/services/automotor.service.ts backend/test/automotor.e2e-spec.ts
git commit -m "$(cat <<'EOF'
feat(api): add GET /automotores/:dominio endpoint

Adds endpoint to get vehicle detail by license plate.
Returns full automotor data with current owner information.

EOF
)"
```

---

## Task 2: Add GET /sujetos/by-cuit Endpoint

**Files:**

- Create: `backend/src/modules/sujetos/controllers/sujeto.controller.ts`
- Create: `backend/src/modules/sujetos/dto/sujeto-response.dto.ts`
- Modify: `backend/src/modules/sujetos/sujetos.module.ts`
- Create: `backend/test/sujeto.e2e-spec.ts`

### Step 2.1: Create SujetoResponseDto

**File:** `backend/src/modules/sujetos/dto/sujeto-response.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { Sujeto } from '../entities/sujeto.entity';

export class SujetoResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '20123456789', description: 'CUIT del sujeto' })
  cuit: string;

  @ApiProperty({ example: 'Juan Pérez', description: 'Denominación o razón social' })
  denominacion: string;

  @ApiProperty({ example: '2024-01-15T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T00:00:00.000Z' })
  updatedAt: Date;

  constructor(entity: Sujeto) {
    this.id = entity.id;
    this.cuit = entity.cuit;
    this.denominacion = entity.denominacion;
    this.createdAt = entity.createdAt;
    this.updatedAt = entity.updatedAt;
  }
}
```

### Step 2.2: Create SujetoController with GET by-cuit endpoint

**File:** `backend/src/modules/sujetos/controllers/sujeto.controller.ts`

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SujetoService } from '../services/sujeto.service';
import { SujetoResponseDto } from '../dto/sujeto-response.dto';
import { ErrorResponseDto } from '../../../common/dto/error-response.dto';
import { EntityNotFoundException } from '../../../common/exceptions/entity-not-found.exception';
import { ErrorCodes } from '../../../common/constants/error-codes';

@ApiTags('sujetos')
@Controller('sujetos')
export class SujetoController {
  constructor(private readonly sujetoService: SujetoService) {}

  @Get('by-cuit')
  @ApiOperation({ summary: 'Get sujeto by CUIT' })
  @ApiQuery({
    name: 'cuit',
    description: 'CUIT to search for',
    example: '20123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'Sujeto found',
    type: SujetoResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Sujeto not found',
    type: ErrorResponseDto,
  })
  async findByCuit(@Query('cuit') cuit: string): Promise<SujetoResponseDto> {
    const sujeto = await this.sujetoService.findByCuit(cuit);
    if (!sujeto) {
      throw new EntityNotFoundException(
        ErrorCodes.SUJETO_NOT_FOUND,
        `Sujeto with CUIT ${cuit} not found`,
      );
    }
    return new SujetoResponseDto(sujeto);
  }
}
```

### Step 2.3: Update SujetosModule to include controller

**File:** `backend/src/modules/sujetos/sujetos.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sujeto } from './entities/sujeto.entity';
import { SujetoRepository } from './repositories/sujeto.repository';
import { SUJETO_REPOSITORY } from './interfaces/sujeto-repository.interface';
import { SujetoService } from './services/sujeto.service';
import { SujetoController } from './controllers/sujeto.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Sujeto])],
  controllers: [SujetoController],
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

### Step 2.4: Create E2E test file for sujetos

**File:** `backend/test/sujeto.e2e-spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import type { Server } from 'http';
import { DataSource } from 'typeorm';
import { SujetosModule } from '../src/modules/sujetos/sujetos.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { getTestDbConfig } from './setup-e2e';
import { Sujeto } from '../src/modules/sujetos/entities/sujeto.entity';
import { VinculoSujetoObjeto } from '../src/modules/vinculos/entities/vinculo-sujeto-objeto.entity';
import { createSujeto, clearAllTables } from './helpers/factories';

describe('SujetoController (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let dataSource: DataSource;

  beforeAll(async () => {
    const dbConfig = getTestDbConfig();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: dbConfig.host,
          port: dbConfig.port,
          database: dbConfig.database,
          username: dbConfig.username,
          password: dbConfig.password,
          entities: [Sujeto, VinculoSujetoObjeto],
          synchronize: true,
        }),
        SujetosModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    await app.init();

    dataSource = moduleFixture.get(DataSource);
    server = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /sujetos/by-cuit', () => {
    beforeEach(async () => {
      await clearAllTables(dataSource);
    });

    it('should return sujeto when found', async () => {
      const sujeto = await createSujeto(dataSource, {
        cuit: '20123456786',
        denominacion: 'Test Sujeto',
      });

      const response = await request(server)
        .get('/sujetos/by-cuit')
        .query({ cuit: '20123456786' })
        .expect(200);

      expect(response.body).toMatchObject({
        id: sujeto.id,
        cuit: '20123456786',
        denominacion: 'Test Sujeto',
      });
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it('should return 404 when sujeto not found', async () => {
      const response = await request(server)
        .get('/sujetos/by-cuit')
        .query({ cuit: '20999999999' })
        .expect(404);

      expect(response.body).toMatchObject({
        statusCode: 404,
        errorCode: 'SUJETO_NOT_FOUND',
      });
    });
  });
});
```

### Step 2.5: Run tests to verify

Run: `cd backend && pnpm test:e2e`
Expected: All tests pass including new sujeto tests

### Step 2.6: Commit

```bash
git add backend/src/modules/sujetos/ backend/test/sujeto.e2e-spec.ts
git commit -m "$(cat <<'EOF'
feat(api): add GET /sujetos/by-cuit endpoint

Adds endpoint to fetch a sujeto by their CUIT.
Returns 404 if sujeto not found.

EOF
)"
```

---

## Task 3: Add POST /sujetos Endpoint with CuitAlreadyExistsException

**Files:**

- Create: `backend/src/common/exceptions/cuit-already-exists.exception.ts`
- Modify: `backend/src/common/constants/error-codes.ts`
- Create: `backend/src/modules/sujetos/dto/create-sujeto.dto.ts`
- Modify: `backend/src/modules/sujetos/interfaces/sujeto-repository.interface.ts`
- Modify: `backend/src/modules/sujetos/repositories/sujeto.repository.ts`
- Modify: `backend/src/modules/sujetos/services/sujeto.service.ts`
- Modify: `backend/src/modules/sujetos/controllers/sujeto.controller.ts`
- Modify: `backend/test/sujeto.e2e-spec.ts`

### Step 3.1: Add CUIT_ALREADY_EXISTS error code

**File:** `backend/src/common/constants/error-codes.ts`

```typescript
export const ErrorCodes = {
  // Automotores
  AUTOMOTOR_NOT_FOUND: 'AUTOMOTOR_NOT_FOUND',

  // Sujetos
  SUJETO_NOT_FOUND: 'SUJETO_NOT_FOUND',
  CUIT_ALREADY_EXISTS: 'CUIT_ALREADY_EXISTS',

  // Generic
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
```

### Step 3.2: Create CuitAlreadyExistsException

**File:** `backend/src/common/exceptions/cuit-already-exists.exception.ts`

```typescript
import { HttpException, HttpStatus } from '@nestjs/common';

export class CuitAlreadyExistsException extends HttpException {
  public readonly errorCode: string;

  constructor(cuit: string) {
    super(
      {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: `Sujeto with CUIT ${cuit} already exists`,
        errorCode: 'CUIT_ALREADY_EXISTS',
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    this.errorCode = 'CUIT_ALREADY_EXISTS';
  }
}
```

### Step 3.3: Create CreateSujetoDto

**File:** `backend/src/modules/sujetos/dto/create-sujeto.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { IsCuit } from '../../../common/validators/is-cuit.validator';

export class CreateSujetoDto {
  @ApiProperty({
    example: '20123456789',
    description: 'CUIT válido (11 dígitos con dígito verificador)',
  })
  @IsCuit()
  cuit: string;

  @ApiProperty({
    example: 'Juan Pérez',
    description: 'Denominación o razón social',
    maxLength: 160,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(160)
  denominacion: string;
}
```

### Step 3.4: Add existsByCuit and create to ISujetoRepository

**File:** `backend/src/modules/sujetos/interfaces/sujeto-repository.interface.ts`

```typescript
import { Sujeto } from '../entities/sujeto.entity';

export const SUJETO_REPOSITORY = Symbol('SUJETO_REPOSITORY');

export interface CreateSujetoData {
  cuit: string;
  denominacion: string;
}

export interface ISujetoRepository {
  findByCuit(cuit: string): Promise<Sujeto | null>;
  existsByCuit(cuit: string): Promise<boolean>;
  create(data: CreateSujetoData): Promise<Sujeto>;
}
```

### Step 3.5: Implement existsByCuit and create in SujetoRepository

**File:** `backend/src/modules/sujetos/repositories/sujeto.repository.ts`

```typescript
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
```

### Step 3.6: Add create method to SujetoService

**File:** `backend/src/modules/sujetos/services/sujeto.service.ts`

```typescript
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
```

### Step 3.7: Add POST endpoint to SujetoController

**File:** `backend/src/modules/sujetos/controllers/sujeto.controller.ts`

Update to add POST endpoint:

```typescript
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SujetoService } from '../services/sujeto.service';
import { SujetoResponseDto } from '../dto/sujeto-response.dto';
import { CreateSujetoDto } from '../dto/create-sujeto.dto';
import { ErrorResponseDto } from '../../../common/dto/error-response.dto';
import { EntityNotFoundException } from '../../../common/exceptions/entity-not-found.exception';
import { ErrorCodes } from '../../../common/constants/error-codes';

@ApiTags('sujetos')
@Controller('sujetos')
export class SujetoController {
  constructor(private readonly sujetoService: SujetoService) {}

  @Get('by-cuit')
  @ApiOperation({ summary: 'Get sujeto by CUIT' })
  @ApiQuery({
    name: 'cuit',
    description: 'CUIT to search for',
    example: '20123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'Sujeto found',
    type: SujetoResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Sujeto not found',
    type: ErrorResponseDto,
  })
  async findByCuit(@Query('cuit') cuit: string): Promise<SujetoResponseDto> {
    const sujeto = await this.sujetoService.findByCuit(cuit);
    if (!sujeto) {
      throw new EntityNotFoundException(
        ErrorCodes.SUJETO_NOT_FOUND,
        `Sujeto with CUIT ${cuit} not found`,
      );
    }
    return new SujetoResponseDto(sujeto);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new sujeto' })
  @ApiResponse({
    status: 201,
    description: 'Sujeto created successfully',
    type: SujetoResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid CUIT format',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 422,
    description: 'CUIT already exists',
    type: ErrorResponseDto,
  })
  async create(@Body() dto: CreateSujetoDto): Promise<SujetoResponseDto> {
    const sujeto = await this.sujetoService.create(dto);
    return new SujetoResponseDto(sujeto);
  }
}
```

### Step 3.8: Add E2E tests for POST /sujetos

**File:** `backend/test/sujeto.e2e-spec.ts`

Add new describe block after `GET /sujetos/by-cuit`:

```typescript
describe('POST /sujetos', () => {
  beforeEach(async () => {
    await clearAllTables(dataSource);
  });

  it('should create a new sujeto', async () => {
    const response = await request(server)
      .post('/sujetos')
      .send({
        cuit: '20123456786',
        denominacion: 'New Sujeto',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      cuit: '20123456786',
      denominacion: 'New Sujeto',
    });
    expect(response.body.id).toBeDefined();
    expect(response.body.createdAt).toBeDefined();
    expect(response.body.updatedAt).toBeDefined();
  });

  it('should return 422 when CUIT already exists', async () => {
    await createSujeto(dataSource, {
      cuit: '20123456786',
      denominacion: 'Existing Sujeto',
    });

    const response = await request(server)
      .post('/sujetos')
      .send({
        cuit: '20123456786',
        denominacion: 'Another Sujeto',
      })
      .expect(422);

    expect(response.body).toMatchObject({
      statusCode: 422,
      errorCode: 'CUIT_ALREADY_EXISTS',
    });
  });

  it('should return 400 for invalid CUIT format', async () => {
    const response = await request(server)
      .post('/sujetos')
      .send({
        cuit: '12345678901',
        denominacion: 'Invalid CUIT Sujeto',
      })
      .expect(400);

    expect(response.body.statusCode).toBe(400);
  });

  it('should return 400 when denominacion is empty', async () => {
    const response = await request(server)
      .post('/sujetos')
      .send({
        cuit: '20123456786',
        denominacion: '',
      })
      .expect(400);

    expect(response.body.statusCode).toBe(400);
  });

  it('should return 400 when denominacion exceeds max length', async () => {
    const response = await request(server)
      .post('/sujetos')
      .send({
        cuit: '20123456786',
        denominacion: 'A'.repeat(161),
      })
      .expect(400);

    expect(response.body.statusCode).toBe(400);
  });
});
```

### Step 3.9: Run tests to verify

Run: `cd backend && pnpm test:e2e`
Expected: All tests pass including new POST /sujetos tests

### Step 3.10: Commit

```bash
git add backend/src/common/exceptions/cuit-already-exists.exception.ts backend/src/common/constants/error-codes.ts backend/src/modules/sujetos/ backend/test/sujeto.e2e-spec.ts
git commit -m "$(cat <<'EOF'
feat(api): add POST /sujetos endpoint

Adds endpoint to create new sujetos with CUIT validation.
Uses custom CuitAlreadyExistsException (422) for duplicate CUIT handling.

EOF
)"
```

---

## Summary

After implementing all tasks, the following endpoints will be available:

| Endpoint                     | Description                            |
| ---------------------------- | -------------------------------------- |
| `GET /automotores/:dominio`  | Get vehicle detail with current owner  |
| `GET /sujetos/by-cuit?cuit=` | Get sujeto by CUIT                     |
| `POST /sujetos`              | Create new sujeto with CUIT validation |

### Test Coverage Added

| Test File               | Tests Added                             |
| ----------------------- | --------------------------------------- |
| `automotor.e2e-spec.ts` | 3 tests for GET /automotores/:dominio   |
| `sujeto.e2e-spec.ts`    | 7 tests (2 for GET by-cuit, 5 for POST) |
