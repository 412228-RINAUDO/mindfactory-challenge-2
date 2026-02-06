# Uso de IA como Acelerador de Desarrollo

Este documento resume las áreas donde se utilizó IA (Claude) para acelerar el desarrollo del proyecto, qué artefactos se generaron y cómo se validaron.

---

## Resumen Ejecutivo

| Área | Artefactos Generados | Validación |
|------|---------------------|------------|
| Testing E2E | Setup Testcontainers, factories, tests | Tests ejecutados contra PostgreSQL real |
| API Endpoints (GET) | Controller, Service, Repository, DTOs | Tests E2E + Swagger |
| API Endpoints (POST) | Validators, DTO, Service create() | Plan de implementación + compilación |
| API Endpoints (PUT) | DTO, Service update(), Controller | Plan de implementación + compilación |
| API Endpoints (DELETE) | Service delete(), Controller | Plan de implementación + compilación |
| Docker Compose | Dockerfiles, healthchecks, compose.yml | docker compose up -d --build |
| Error Handling | Exception filter, custom exceptions | Tests E2E verifican respuestas 404/422 |
| Documentación | CLAUDE.md actualizado | Revisión manual |

---

## 1. Infraestructura de Testing E2E

### Problema
Se necesitaban tests E2E reales (no mocks) que validaran el flujo completo de la API contra una base de datos PostgreSQL.

### Proceso de Desarrollo con IA

1. **Exploración de alternativas**: Se evaluaron múltiples opciones para base de datos de testing:
   - `pg-mem` (descartado: no soporta `('now'::text)::date` de TypeORM)
   - SQLite in-memory (descartado: no soporta tipos PostgreSQL como `timestamptz`)
   - **Testcontainers** (elegido): levanta un contenedor Docker con PostgreSQL real

2. **Resolución de problemas**:
   - Docker socket no encontrado con OrbStack → Solucionado con symlink
   - Inyección de dependencias NestJS → Configuración correcta de `TypeOrmModule.forRoot()`

### Artefactos Generados

```
backend/test/
├── setup-e2e.ts              # Configuración global de Testcontainers
├── jest-e2e.json             # Configuración Jest para E2E
├── automotor.e2e-spec.ts     # 11 tests E2E del controller
└── helpers/
    └── factories/
        ├── index.ts
        ├── sujeto.factory.ts
        ├── objeto-valor.factory.ts
        ├── automotor.factory.ts
        ├── vinculo.factory.ts
        └── clear-tables.helper.ts
```

### Validación

- **Ejecución real**: `pnpm test:e2e` ejecuta tests contra PostgreSQL 16 en Docker
- **Aislamiento**: Cada test limpia tablas con `clearAllTables()` en `beforeEach`
- **Cobertura**: 11 tests cubriendo casos de lista, detalle, con/sin dueño, dueño responsable vs no responsable, vínculos inactivos

---

## 2. Factory Pattern para Test Data

### Problema
Crear datos de prueba de forma consistente y mantenible, evitando archivos seeder monolíticos.

### Artefactos Generados

Cada factory permite crear entidades con valores por defecto sensatos y opciones de personalización:

```typescript
// Ejemplo de uso
const sujeto = await createSujeto(dataSource, { cuit: '20123456789' });
const auto = await createAutomotor(dataSource, { dominio: 'AA123BB' });
await createVinculo(dataSource, { ovpId: auto.ovpId, spoId: sujeto.id });
```

### Validación

- Factories utilizadas en todos los tests E2E
- Cada test crea solo los datos que necesita (self-documenting)
- Contadores automáticos evitan colisiones de IDs/CUITs

---

## 3. API Endpoints de Automotores

### Artefactos Generados

```
backend/src/entities/automotores/
├── controllers/
│   └── automotores.controller.ts
├── services/
│   └── automotores.service.ts
├── repositories/
│   └── automotor.repository.ts
├── interfaces/
│   └── automotor-repository.interface.ts
├── dto/
│   ├── automotor-list-response.dto.ts
│   ├── automotor-detail-response.dto.ts
│   └── dueno-response.dto.ts
└── automotores.module.ts
```

### Endpoints Implementados

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/automotores` | Lista vehículos con dueño responsable actual |
| GET | `/automotores/:dominio` | Detalle de vehículo por patente |

### Lógica de Negocio (según XML)

- Solo se muestra el dueño con `responsable = 'S'` y `fecha_fin IS NULL`
- Vehículos sin dueño activo retornan `cuit: null, dueno: null`

### Validación

- Tests E2E verifican todos los casos edge
- Swagger documenta endpoints y DTOs
- Query builders replican la lógica de `vw_automotores_con_dueno`

---

## 4. Error Handling Infrastructure

### Artefactos Generados

```
backend/src/common/
├── filters/
│   └── http-exception.filter.ts
└── exceptions/
    └── automotor-not-found.exception.ts
```

### Formato de Error Estandarizado

```json
{
  "statusCode": 404,
  "errorCode": "AUTOMOTOR_NOT_FOUND",
  "message": "Automotor with dominio 'XYZ' not found",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/automotores/XYZ"
}
```

### Validación

- Test E2E verifica respuesta 404 con estructura correcta
- Filter registrado globalmente en `main.ts`

---

## 5. Documentación Técnica

### CLAUDE.md Actualizado

Se agregaron secciones sobre:

1. **Excepción a regla XML**: Frontend requirements tienen prioridad sobre XML para campos adicionales en responses
2. **E2E Testing con Testcontainers**: Guía completa de setup y factories
3. **Factory Pattern**: Ejemplos de implementación y uso

### Validación

- Documentación revisada manualmente
- Consistente con el código implementado

---

## 6. Commits Atómicos

### Commits Generados

```
feat(api): add error handling infrastructure
feat(api): add automotor list and detail endpoints
test(e2e): add testcontainers setup and factories
test(e2e): add automotor controller tests
docs: update CLAUDE.md with e2e testing guide
feat(api): register global exception filter
chore: remove unnecessary eslint-disable comment
```

### Validación

- Cada commit es atómico y con propósito único
- Formato Conventional Commits
- Pusheados a branch `feat/backend-api`

---

## 7. POST /automotores - Crear/Actualizar Automotor

### Problema
Implementar endpoint que crea o actualiza un automotor y asigna dueño por CUIT, replicando la lógica del procedimiento `registrar_alta` del XML de Oracle Forms.

### Proceso de Desarrollo con IA

1. **Brainstorming del diseño**: Se discutió el comportamiento (upsert vs create-only)
2. **Decisión de arquitectura**: Services hablan con Services, no con Repositories de otros módulos
3. **Validadores custom**: Diseño de `@IsDominio()`, `@IsCuit()`, `@IsFechaFabricacion()`
4. **Manejo de errores**: 404 para Sujeto no encontrado (no 422, porque es recurso faltante)

### Artefactos Generados

```
docs/plans/
├── 2026-02-05-post-automotores-design.md
└── 2026-02-05-post-automotores-implementation.md

backend/src/common/validators/
├── is-dominio.validator.ts
├── is-cuit.validator.ts
└── is-fecha-fabricacion.validator.ts

backend/src/modules/automotores/dto/
└── create-automotor.dto.ts
```

### Validación
- Plan de implementación con 12 tareas detalladas
- Cada tarea incluye código completo y comandos de verificación
- Tests unitarios para validadores incluidos en el plan

---

## 8. PUT /automotores/:dominio - Actualizar Automotor

### Problema
Implementar endpoint que actualiza un automotor existente y opcionalmente reasigna dueño si el CUIT cambió.

### Proceso de Desarrollo con IA

1. **Clarificación de reglas**: Solo actualiza si existe (404 si no), a diferencia de POST que hace upsert
2. **Optimización**: Solo reasigna dueño si el CUIT realmente cambió (evita operaciones innecesarias)
3. **Refactoring arquitectural**: Crear SujetoService y VinculoService para comunicación entre módulos

### Decisiones de Diseño

| Decisión | Justificación |
|----------|---------------|
| Partial update | Todos los campos opcionales en UpdateAutomotorDto |
| CUIT en body (no URL) | Solo se envía si se quiere cambiar dueño |
| Verificar cambio de CUIT | `if (newOwner.cuit !== currentOwnerCuit)` evita reasignaciones innecesarias |

### Artefactos Generados

```
docs/plans/
├── 2026-02-05-put-automotores-design.md
└── 2026-02-05-put-automotores-implementation.md

backend/src/modules/
├── sujetos/services/sujeto.service.ts
├── vinculos/services/vinculo.service.ts
└── automotores/dto/update-automotor.dto.ts
```

### Validación
- Plan de implementación con 8 tareas
- Incluye refactoring de AutomotorService para usar services en lugar de repositories

---

## 9. DELETE /automotores/:dominio - Eliminar Automotor

### Problema
Implementar endpoint que elimina un automotor y sus entidades relacionadas.

### Proceso de Desarrollo con IA

1. **Análisis del XML**: El procedimiento `eliminar` hace DELETE manual en orden
2. **Análisis del schema**: Las tablas tienen `ON DELETE CASCADE`
3. **Decisión**: Confiar en CASCADE de la BD (más simple, mismo resultado)

### Artefactos Generados

```
docs/plans/
├── 2026-02-05-delete-automotores-design.md
└── 2026-02-05-delete-automotores-implementation.md

backend/src/modules/objetos-valor/services/
└── objeto-valor.service.ts
```

### Validación
- Plan de implementación con 5 tareas
- Aprovecha `ON DELETE CASCADE` del schema SQL

---

## 10. Docker Compose con Healthchecks

### Problema
Configurar `docker compose up -d --build` para levantar db, api y web con healthchecks.

### Proceso de Desarrollo con IA

1. **Análisis de requerimientos**: CHALLENGE.md especifica "Angular servido (node)"
2. **Decisión de frontend**: Opción C - build producción + `serve` (servidor estático Node)
3. **Healthchecks**: pg_isready para db, wget para api y web

### Artefactos Generados

```
docs/plans/
├── 2026-02-05-docker-compose-design.md
└── 2026-02-05-docker-compose-implementation.md

backend/
├── Dockerfile
├── .dockerignore
└── src/health/
    ├── health.controller.ts
    └── health.module.ts

frontend/
├── Dockerfile
└── .dockerignore

docker-compose.yml (actualizado)
```

### Configuración de Servicios

| Servicio | Base Image | Healthcheck | Depends On |
|----------|------------|-------------|------------|
| db | postgres:16-alpine | pg_isready | - |
| api | node:20-alpine | wget /api/health | db (healthy) |
| web | node:20-alpine | wget localhost:4200 | api (healthy) |

### Validación
- Plan de implementación con 6 tareas
- Test final: `docker compose up -d --build` levanta todo

---

## Lecciones Aprendidas

### Qué funcionó bien

1. **Iteración rápida**: La IA pudo pivotear entre alternativas (pg-mem → SQLite → Testcontainers) cuando surgieron incompatibilidades
2. **Factory pattern**: Generación automática de factories consistentes para todas las entidades
3. **Tests comprehensivos**: 11 tests cubriendo casos normales y edge cases
4. **Diseño incremental**: Presentar diseño en secciones pequeñas permitió validación progresiva
5. **Planes detallados**: Planes de implementación con código completo, listos para ejecutar en sesión paralela
6. **Clarificación de dudas**: Discusión de HTTP status codes (422 vs 404), arquitectura (services vs repositories)

### Qué requirió intervención humana

1. **Decisiones de arquitectura**: Elección entre alternativas de DB testing
2. **Priorización de requerimientos**: Frontend vs XML como fuente de verdad
3. **Configuración de entorno**: Docker socket path específico de OrbStack
4. **Formato de commits**: Preferencia por mensajes sin co-author signature
5. **Clarificación de reglas de negocio**: ¿Qué pasa si el CUIT no existe? ¿Se crea automáticamente?
6. **Arquitectura de módulos**: Services hablan con Services, no con Repositories de otros módulos
7. **Optimizaciones**: Solo reasignar dueño si el CUIT realmente cambió

---

## Métricas

| Métrica | Valor |
|---------|-------|
| Tests E2E creados | 11 |
| Factories implementadas | 4 + 1 helper |
| Endpoints diseñados | 5 (GET list, GET detail, POST, PUT, DELETE) |
| DTOs creados | 5 (list, detail, dueno, create, update) |
| Validadores custom | 3 (@IsDominio, @IsCuit, @IsFechaFabricacion) |
| Services nuevos | 4 (Sujeto, Vinculo, ObjetoValor, Health) |
| Documentos de diseño | 4 |
| Planes de implementación | 4 |
| Dockerfiles | 2 (backend, frontend) |
| Commits atómicos | 7+ |

---

## Riesgos y Mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Código generado sin contexto completo | Revisión humana de cada diseño antes de implementar |
| Validadores con bugs | Tests unitarios incluidos en planes de implementación |
| Arquitectura inconsistente | Discusión explícita de patrones (services→services) |
| Docker no funciona | Healthchecks con reintentos + depends_on conditions |
| Lógica de negocio incorrecta | Referencia constante al XML y CHALLENGE.md |

---

## Enfoque vs Alternativas

### Por qué Claude Code en lugar de otras herramientas

1. **Contexto del proyecto**: Acceso directo a archivos, puede leer y entender la estructura existente
2. **Iteración rápida**: Preguntas de clarificación en tiempo real
3. **Planes ejecutables**: Genera planes detallados que otra sesión puede ejecutar
4. **Consistencia**: Sigue las convenciones del CLAUDE.md automáticamente

### Por qué diseño incremental

1. **Validación temprana**: Cada sección se valida antes de continuar
2. **Flexibilidad**: Fácil cambiar dirección si algo no convence
3. **Documentación**: El proceso de diseño queda documentado

### Por qué planes de implementación separados

1. **Ejecución paralela**: Múltiples tareas pueden ejecutarse en sesiones separadas
2. **Reproducibilidad**: Cualquiera puede seguir el plan paso a paso
3. **Verificación**: Cada tarea incluye comando de verificación
