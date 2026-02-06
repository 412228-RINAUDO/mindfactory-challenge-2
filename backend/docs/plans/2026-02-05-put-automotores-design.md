# Design: PUT /automotores/:dominio Endpoint

## Overview

Implement `PUT /api/automotores/:dominio` endpoint that updates an existing automotor and optionally reassigns the owner.

**Behavior:** Update only - automotor must exist (404 if not).

## API Contract

```
PUT /automotores/:dominio
Content-Type: application/json

{
  "numeroChasis": "ABC123456789",    // optional
  "numeroMotor": "MOT987654",        // optional
  "color": "Rojo",                   // optional
  "fechaFabricacion": 202401,        // optional
  "cuitDueno": "20123456789"         // optional - only if changing owner
}

Response: 200 OK
Body: AutomotorDetailResponseDto
```

## Differences with POST

| Aspect | POST | PUT |
|--------|------|-----|
| Automotor doesn't exist | Creates it | 404 `AUTOMOTOR_NOT_FOUND` |
| Dominio in body | Required | Not allowed (comes from URL) |
| All fields | Required (except optional) | All optional (partial update) |

## Validations (DTO layer)

| Field | Validator | Rule |
|-------|-----------|------|
| `fechaFabricacion` | `@IsFechaFabricacion()` | 6 digits, month 1-12, not future (optional) |
| `cuitDueno` | `@IsCuit()` | Module 11 algorithm (optional) |

## Business Rules (Service layer)

1. **Automotor must exist** - If dominio doesn't match an existing Automotor, return 404 `AUTOMOTOR_NOT_FOUND`
2. **Sujeto must exist** - If `cuitDueno` provided and doesn't match an existing Sujeto, return 404 `SUJETO_NOT_FOUND`
3. **Reassign only if changed** - Only close/create vinculo if `cuitDueno` is different from current owner

## Architecture

```
PUT /automotores/:dominio

┌──────────────┐     ┌──────────────────┐     ┌────────────────────┐
│  Controller  │────►│ AutomotorService │────►│ AutomotorRepository│
└──────────────┘     └──────────────────┘     └────────────────────┘
                              │
                              ├────►  SujetoService.findByCuit()
                              │
                              └────►  VinculoService.reassignOwner()
```

**Key:** Services talk to Services, not directly to other module's Repositories.

## Service Logic

```typescript
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
  let newOwner: Sujeto | null = null;
  if (dto.cuitDueno) {
    newOwner = await this.sujetoService.findByCuit(dto.cuitDueno);
    if (!newOwner) {
      throw new EntityNotFoundException(
        ErrorCodes.SUJETO_NOT_FOUND,
        `Sujeto with CUIT ${dto.cuitDueno} not found`,
      );
    }
  }

  // 3. Execute update in transaction
  await this.dataSource.transaction(async (manager) => {
    // 3.1 Update automotor fields (only provided ones)
    await this.automotorRepository.update(dominio, dto, manager);

    // 3.2 Reassign owner only if CUIT actually changed
    const currentOwnerCuit = existingAutomotor.duenoCuit;
    if (newOwner && newOwner.cuit !== currentOwnerCuit) {
      const objectId = existingAutomotor.objetoDeValorId;
      await this.vinculoService.reassignOwner(objectId, newOwner.id, manager);
    }
  });

  // 4. Return updated detail
  return this.findByDominio(dominio);
}
```

## Files to Create

| File | Purpose |
|------|---------|
| `modules/automotores/dto/update-automotor.dto.ts` | Input DTO for PUT |
| `modules/sujetos/services/sujeto.service.ts` | Service with `findByCuit()` |
| `modules/vinculos/services/vinculo.service.ts` | Service with `reassignOwner()` |

## Files to Modify

| File | Change |
|------|--------|
| `automotor.controller.ts` | Add `@Put(':dominio')` endpoint |
| `automotor.service.ts` | Add `update()` method, inject `SujetoService` and `VinculoService` |
| `automotor-repository.interface.ts` | Add `update()` signature |
| `automotor.repository.ts` | Implement `update()` |
| `sujetos.module.ts` | Add and export `SujetoService` |
| `vinculos.module.ts` | Add and export `VinculoService` |
| `automotores.module.ts` | Import `SujetosModule` and `VinculosModule` |

## Error Responses

| Scenario | HTTP | Code |
|----------|------|------|
| DTO validation fails | 400 | `VALIDATION_ERROR` |
| Automotor not found by dominio | 404 | `AUTOMOTOR_NOT_FOUND` |
| Sujeto not found by CUIT | 404 | `SUJETO_NOT_FOUND` |
| Database constraint violation | 500 | `INTERNAL_SERVER_ERROR` |

## Testing Strategy

**Unit tests:**
- Service logic with mocked repositories/services

**E2E tests:**
- PUT updates automotor fields without changing owner
- PUT updates automotor and reassigns owner when CUIT changes
- PUT does NOT reassign when same CUIT is sent
- PUT returns 404 when automotor doesn't exist
- PUT returns 404 when CUIT doesn't exist
- PUT returns 400 for invalid CUIT/fecha
