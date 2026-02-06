# Design: DELETE /automotores/:dominio Endpoint

## Overview

Implement `DELETE /api/automotores/:dominio` endpoint that deletes an automotor and its related entities using database CASCADE.

**Behavior:** Delete ObjetoDeValor, database CASCADE handles Automotor and Vinculos deletion automatically.

## API Contract

```
DELETE /automotores/:dominio

Response: 204 No Content (no body)
```

## Business Rules

1. **Automotor must exist** - If dominio doesn't match an existing Automotor, return 404 `AUTOMOTOR_NOT_FOUND`
2. **CASCADE deletion** - Deleting ObjetoDeValor triggers automatic deletion of:
   - Automotor (via `ON DELETE CASCADE` on `atr_ovp_id`)
   - VinculoSujetoObjeto (via `ON DELETE CASCADE` on `vso_ovp_id`)

## Architecture

```
DELETE /automotores/:dominio

┌──────────────┐     ┌──────────────────┐     ┌────────────────────┐
│  Controller  │────►│ AutomotorService │────►│ AutomotorRepository│
└──────────────┘     └──────────────────┘     └────────────────────┘
                              │
                              └────►  ObjetoValorService.delete()
```

## Service Logic

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

## Files to Create

| File | Purpose |
|------|---------|
| `modules/objetos-valor/services/objeto-valor.service.ts` | Service with `delete()` |

## Files to Modify

| File | Change |
|------|--------|
| `objeto-valor-repository.interface.ts` | Add `delete()` signature |
| `objeto-valor.repository.ts` | Implement `delete()` |
| `objetos-valor.module.ts` | Add and export `ObjetoValorService` |
| `automotor.service.ts` | Add `delete()` method, inject `ObjetoValorService` |
| `automotor.controller.ts` | Add `@Delete(':dominio')` endpoint |

## Error Responses

| Scenario | HTTP | Code |
|----------|------|------|
| Automotor not found by dominio | 404 | `AUTOMOTOR_NOT_FOUND` |

## Testing Strategy

**E2E tests:**
- DELETE removes automotor, objeto_de_valor, and vinculos
- DELETE returns 404 when automotor doesn't exist
- GET after DELETE returns 404
