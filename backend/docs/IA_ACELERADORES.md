# Uso de IA/Aceleradores

Este documento describe el uso de herramientas de IA durante el desarrollo del proyecto, siguiendo los lineamientos del challenge.

---

## Herramientas Utilizadas

- **Claude Code (Anthropic)** - Asistente de programación en CLI para diseño, planificación e implementación

---

## Áreas Donde se Utilizó IA

### 1. Diseño de Arquitectura de API

- **Qué se pidió**: Diseño de los endpoints POST, PUT y DELETE para `/api/automotores` siguiendo la especificación del XML de Oracle Forms
- **Por qué**: Para garantizar que la arquitectura siguiera el patrón de capas (Controller → Service → Repository) y el principio de inversión de dependencias definidos en CLAUDE.md
- **Qué se generó**:
  - `2026-02-05-post-automotores-design.md` - Diseño del endpoint POST con contrato de API, validaciones y flujo de transacciones
  - `2026-02-05-put-automotores-design.md` - Diseño del endpoint PUT con lógica de actualización parcial
  - `2026-02-05-delete-automotores-design.md` - Diseño del endpoint DELETE con CASCADE
- **Cómo se validó**:
  - Revisión manual contra el XML original (`alta_automotor.xml`) para verificar fidelidad a las reglas de negocio
  - Verificación de que la arquitectura cumpliera con los patrones definidos en CLAUDE.md

### 2. Planes de Implementación Detallados

- **Qué se pidió**: Planes paso a paso para implementar cada endpoint con código TypeScript/NestJS
- **Por qué**: Para tener una guía clara de implementación que siguiera TDD (Test-Driven Development) y permitiera commits atómicos
- **Qué se generó**:
  - `2026-02-05-post-automotores-implementation.md` - 12 tareas, 21 archivos
  - `2026-02-05-put-automotores-implementation.md` - 8 tareas, 11 archivos
  - `2026-02-05-delete-automotores-implementation.md` - 5 tareas, 6 archivos
- **Cómo se validó**:
  - Cada tarea incluía el comando específico de test a ejecutar
  - Verificación de compilación (`pnpm build`) después de cada paso
  - Tests unitarios y E2E al final de cada plan

### 3. Validadores Customizados

- **Qué se pidió**: Implementación de validadores para dominio, CUIT y fecha de fabricación según las reglas del XML
- **Por qué**: Las validaciones son críticas para la fidelidad al sistema original y deben replicar exactamente la lógica PL/SQL
- **Qué se generó**:
  - `@IsDominio()` - Regex: `^[A-Z]{3}[0-9]{3}$|^[A-Z]{2}[0-9]{3}[A-Z]{2}$`
  - `@IsCuit()` - Algoritmo módulo 11 con coeficientes `[5,4,3,2,7,6,5,4,3,2]`
  - `@IsFechaFabricacion()` - Formato YYYYMM, mes 1-12, no futuro, año >= 1900
- **Cómo se validó**:
  - Tests unitarios exhaustivos para cada validador (casos válidos e inválidos)
  - Comparación directa con la función `es_cuit_valido` y procedimientos del XML

### 4. DTOs y Contratos de API

- **Qué se pidió**: DTOs con decoradores de class-validator y Swagger
- **Por qué**: Para garantizar validación automática en la capa del controlador y documentación OpenAPI
- **Qué se generó**:
  - `CreateAutomotorDto` - Todos los campos requeridos para alta
  - `UpdateAutomotorDto` - Todos los campos opcionales para actualización parcial
- **Cómo se validó**:
  - Compilación TypeScript sin errores
  - Verificación de que Swagger generara la documentación correcta

### 5. Servicios para Comunicación Cross-Module

- **Qué se pidió**: Refactorización para que los servicios se comuniquen entre módulos (no repositorios directamente)
- **Por qué**: Seguir el patrón "services talk to services" para mejor encapsulamiento y testabilidad
- **Qué se generó**:
  - `SujetoService` con método `findByCuit()`
  - `VinculoService` con métodos `closeCurrentOwner()`, `createOwnerLink()`, `reassignOwner()`
  - `ObjetoValorService` con métodos `upsert()`, `delete()`
- **Cómo se validó**:
  - Tests de integración verificando la comunicación entre servicios
  - Verificación de que las transacciones mantuvieran consistencia

### 6. Lógica de Transacciones

- **Qué se pidió**: Implementación del flujo transaccional para el alta/actualización de automotores
- **Por qué**: El XML define un flujo específico: validar sujeto → upsert objeto de valor → upsert automotor → cerrar dueño anterior → crear nuevo vínculo
- **Qué se generó**:
  - Método `create()` en `AutomotorService` con `DataSource.transaction()`
  - Método `update()` con lógica de reasignación condicional
  - Método `delete()` usando CASCADE de la base de datos
- **Cómo se validó**:
  - Tests E2E que verifican el estado de la BD después de cada operación
  - Verificación de que los vínculos anteriores se cierren correctamente

---

## Qué NO se Delegó Completamente

- **Revisión de reglas de negocio**: Cada pieza de código generada fue comparada manualmente contra el XML original
- **Decisiones de arquitectura**: La estructura de módulos y la elección de patrones fue decidida previamente
- **Configuración de infraestructura**: Docker, TypeORM y configuración de base de datos
- **Tests E2E**: Aunque la IA ayudó con la estructura, los casos de prueba específicos fueron revisados

---

## Riesgos y Mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Código generado no sigue exactamente las reglas del XML | Comparación línea por línea con el PL/SQL original, especialmente para validaciones |
| Validadores con edge cases incorrectos | Suite de tests unitarios con casos límite (CUIT inválidos, dominios con minúsculas, fechas futuras) |
| Transacciones incompletas o inconsistentes | Tests E2E que verifican el estado de todas las tablas después de cada operación |
| Over-engineering por parte de la IA | Revisión para eliminar abstracciones innecesarias y mantener el código simple |
| Dependencias circulares entre módulos | Uso del patrón "services talk to services" con exports explícitos en cada módulo |

---

## Justificación del Enfoque

### Por qué usar IA para este proyecto

1. **Velocidad de desarrollo**: Un challenge de 72 horas requiere eficiencia. La IA permitió generar boilerplate y estructura rápidamente.

2. **Consistencia de patrones**: La IA mantuvo consistencia en nombrado, estructura de archivos y patrones de código a lo largo de todo el proyecto.

3. **Documentación integrada**: Los planes de diseño e implementación sirven como documentación técnica del proyecto.

### Comparación con alternativas manuales

| Aspecto | Con IA | Manual |
|---------|--------|--------|
| Tiempo para validadores | ~30 min (generación + tests) | ~2-3 horas |
| Consistencia de código | Alta (mismo patrón en todos los archivos) | Variable |
| Documentación | Generada automáticamente | Requiere esfuerzo adicional |
| Riesgo de errores tipográficos | Bajo | Medio |
| Revisión necesaria | Sí (fidelidad a reglas) | Sí (bugs lógicos) |

### Conclusión

La IA funcionó como un **acelerador**, no como un reemplazo del criterio del desarrollador. Cada output fue validado contra:
- La especificación XML original
- Las convenciones definidas en CLAUDE.md
- Tests automatizados (unitarios y E2E)

El enfoque permitió cumplir con los requisitos del challenge mientras se mantenía la calidad y fidelidad al sistema original.
