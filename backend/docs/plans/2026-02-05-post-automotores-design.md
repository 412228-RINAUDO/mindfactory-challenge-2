# Design: POST /automotores Endpoint

## Overview

Implement `POST /api/automotores` endpoint that creates or updates an automotor and assigns an owner by CUIT.

**Behavior:** Upsert - if the automotor exists, update it and reassign owner.

## API Contract

```
POST /automotores
Content-Type: application/json

{
  "dominio": "AA123BB",
  "numeroChasis": "ABC123456789",    // optional
  "numeroMotor": "MOT987654",        // optional
  "color": "Rojo",                   // optional
  "fechaFabricacion": 202401,
  "cuitDueno": "20123456789"
}

Response: 201 Created
Body: AutomotorDetailResponseDto
```

## Validations (DTO layer)

| Field | Validator | Rule |
|-------|-----------|------|
| `dominio` | `@IsDominio()` | Regex: `^[A-Z]{3}[0-9]{3}$\|^[A-Z]{2}[0-9]{3}[A-Z]{2}$` |
| `fechaFabricacion` | `@IsFechaFabricacion()` | 6 digits, month 1-12, not future |
| `cuitDueno` | `@IsCuit()` | Module 11 algorithm |

## Business Rules (Service layer)

1. **Sujeto must exist** - If CUIT doesn't match an existing Sujeto, return 404 `SUJETO_NOT_FOUND`
2. **Single active owner** - Close previous owner link (set `fechaFin`) before creating new one
3. **Upsert logic** - Create or update based on dominio existence

## Architecture

```
Controller                    Service                         Repositories
    │                            │                                 │
    │  CreateAutomotorDto        │                                 │
    ├───────────────────────────►│                                 │
    │                            │  DataSource.transaction()       │
    │                            ├────────────────────────────────►│
    │                            │  1. findByCuit()                │ SujetoRepo
    │                            │  2. upsert()                    │ ObjetoValorRepo
    │                            │  3. upsert()                    │ AutomotorRepo
    │                            │  4. closeCurrentOwner()         │ VinculoRepo
    │                            │  5. createOwnerLink()           │ VinculoRepo
    │                            │◄────────────────────────────────┤
    │  AutomotorDetailResponseDto│                                 │
    │◄───────────────────────────┤                                 │
```

## Transaction Flow (from XML `registrar_alta`)

```typescript
async create(dto: CreateAutomotorDto): Promise<AutomotorDetailResponseDto> {
  // 1. Validate Sujeto exists (outside transaction is OK - read only)
  const sujeto = await this.sujetoRepository.findByCuit(dto.cuitDueno);
  if (!sujeto) {
    throw new EntityNotFoundException(ErrorCodes.SUJETO_NOT_FOUND, 'No existe Sujeto con ese CUIT');
  }

  // 2. Execute upsert in transaction
  await this.dataSource.transaction(async (manager) => {
    // 2.1 Upsert ObjetoDeValor
    const objetoDeValor = await this.objetoValorRepository.upsert(dto.dominio, manager);

    // 2.2 Upsert Automotor
    await this.automotorRepository.upsert({
      ovpId: objetoDeValor.id,
      dominio: dto.dominio,
      numeroChasis: dto.numeroChasis ?? null,
      numeroMotor: dto.numeroMotor ?? null,
      color: dto.color ?? null,
      fechaFabricacion: dto.fechaFabricacion,
    }, manager);

    // 2.3 Close previous owner link
    await this.vinculoRepository.closeCurrentOwner(objetoDeValor.id, manager);

    // 2.4 Create new owner link
    await this.vinculoRepository.createOwnerLink({
      ovpId: objetoDeValor.id,
      spoId: sujeto.id,
      tipoVinculo: 'DUENO',
      porcentaje: 100,
      responsable: 'S',
    }, manager);
  });

  // 3. Return full detail
  return this.findByDominio(dto.dominio);
}
```

## Files to Create

| File | Purpose |
|------|---------|
| `common/validators/is-dominio.validator.ts` | `@IsDominio()` decorator |
| `common/validators/is-cuit.validator.ts` | `@IsCuit()` decorator |
| `common/validators/is-fecha-fabricacion.validator.ts` | `@IsFechaFabricacion()` decorator |
| `modules/automotores/dto/create-automotor.dto.ts` | Input DTO |
| `modules/sujetos/repositories/sujeto.repository.ts` | `findByCuit()` |
| `modules/sujetos/interfaces/sujeto-repository.interface.ts` | Interface |
| `modules/objetos-valor/repositories/objeto-valor.repository.ts` | `upsert()` |
| `modules/objetos-valor/interfaces/objeto-valor-repository.interface.ts` | Interface |
| `modules/vinculos/repositories/vinculo.repository.ts` | `closeCurrentOwner()`, `createOwnerLink()` |
| `modules/vinculos/interfaces/vinculo-repository.interface.ts` | Interface |

## Files to Modify

| File | Change |
|------|--------|
| `automotor.controller.ts` | Add `@Post()` endpoint |
| `automotor.service.ts` | Add `create()` method with transaction |
| `automotor-repository.interface.ts` | Add `upsert()` signature |
| `automotor.repository.ts` | Implement `upsert()` |
| `automotores.module.ts` | Import dependencies, inject DataSource |
| `sujetos.module.ts` | Export repository provider |
| `objetos-valor.module.ts` | Export repository provider |
| `vinculos.module.ts` | Export repository provider |

## Error Responses

| Scenario | HTTP | Code |
|----------|------|------|
| DTO validation fails | 400 | `VALIDATION_ERROR` |
| Sujeto not found by CUIT | 404 | `SUJETO_NOT_FOUND` |
| Database constraint violation | 500 | `INTERNAL_SERVER_ERROR` |

## Testing Strategy

**Unit tests:**
- Custom validators (dominio, CUIT, fechaFabricacion)
- Service logic with mocked repositories

**E2E tests:**
- POST creates new automotor with owner
- POST updates existing automotor and reassigns owner
- POST returns 422 when CUIT doesn't exist
- POST returns 400 for invalid dominio/CUIT/fecha
