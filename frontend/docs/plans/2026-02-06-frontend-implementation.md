# Frontend Implementation Plan - Automotores CRUD

## Overview

Implement an Angular 21 frontend for vehicle management (Automotores) with owner assignment via CUIT. Minimalist UI using PrimeNG components.

## Requirements Summary

From CHALLENGE.md:

- **List Page**: dominio, dueno, CUIT, fecha fabricacion, "Editar" link
- **Form Page**: create/edit with fields: dominio, chasis, motor, color, fecha fabricacion (YYYYMM), CUIT dueno, **nombre del dueño (readonly)**
- **Validations**: dominio (AAA999 or AA999AA), CUIT (11 digits + module 11), fecha fabricacion (YYYYMM, month 1-12, not future)
- **Flow**: If CUIT doesn't exist, allow creating sujeto via dialog **on CUIT field blur**

## Folder Structure

```
src/app/
├── core/
│   ├── interceptors/
│   │   ├── api.interceptor.ts           # Base URL + connection error handling
│   │   └── case-transform.interceptor.ts # snake_case → camelCase responses
│   ├── constants/
│   │   └── error-messages.ts            # errorCode → Spanish messages mapping
│   └── services/
│       └── notification.service.ts
├── shared/
│   ├── validators/
│   │   ├── dominio.validator.ts
│   │   ├── cuit.validator.ts
│   │   └── fecha-fabricacion.validator.ts
│   └── components/
│       └── page-header/
├── features/
│   └── automotores/
│       ├── models/
│       │   ├── automotor.model.ts
│       │   └── sujeto.model.ts
│       ├── services/
│       │   ├── automotor.service.ts
│       │   ├── sujeto.service.ts
│       │   └── automotor-state.service.ts
│       ├── components/
│       │   ├── automotor-list/
│       │   ├── automotor-form/
│       │   └── sujeto-dialog/
│       └── automotores.routes.ts
└── app.routes.ts
```

## Implementation Phases

### Phase 1: Setup & Core Infrastructure

1. **Install PrimeNG**

   ```bash
   npm install primeng @primeng/themes
   ```

2. **Configure app.config.ts**
   - Add PrimeNG providers with Aura theme
   - Add HttpClient with interceptors (apiInterceptor, caseTransformInterceptor)
   - Add MessageService, ConfirmationService

3. **Create interceptors**
   - `api.interceptor.ts` - Base URL and connection error handling
   - `case-transform.interceptor.ts` - Transform response keys from snake_case to camelCase

4. **Create error messages mapping**
   - `error-messages.ts` - Map backend errorCode to Spanish user messages

5. **Create NotificationService** wrapping PrimeNG MessageService

### Phase 2: Shared Validators

1. **dominioValidator** - Pattern: `^[A-Z]{3}[0-9]{3}$|^[A-Z]{2}[0-9]{3}[A-Z]{2}$`

2. **cuitValidator** - 11 digits + module 11 check digit algorithm (strips non-numeric chars for mask support)

3. **fechaFabricacionValidator** - YYYYMM, year >= 1900, month 1-12, not future

### Phase 3: Models & Services

**Models** (matching backend DTOs in camelCase):
- `AutomotorListItem` (list response)
- `AutomotorDetail` (detail response with duenoActual)
- `CreateAutomotorRequest`, `UpdateAutomotorRequest`
- `Sujeto`, `CreateSujetoRequest`

**Services**:
- `AutomotorService` - HTTP methods for CRUD
- `SujetoService` - getByCuit, create
- `AutomotorStateService` - Signal-based state management

### Phase 4: List Feature

**AutomotorListComponent** (presentational)
- PrimeNG Table with columns: dominio, dueno, cuit, fechaFabricacion
- Edit/Delete action buttons
- Signal inputs: automotores, loading

**AutomotorListPageComponent** (container)
- Loads data via state service
- Handles navigation and delete confirmation
- Route: `/automotores`

### Phase 5: Form Feature

**AutomotorFormComponent** (presentational)
- Reactive form with all validations
- Dominio readonly in edit mode
- CUIT with input mask (99-99999999-9)
- **Nombre del Dueño field (readonly)** - Shows owner name after CUIT validation
- **onBlur event for CUIT** - Validates CUIT existence on blur
- Signal inputs: automotor, isEditMode, loading, denominacionDueno, loadingDueno
- Signal outputs: submitted, cancelled, cuitValidated

**SujetoDialogComponent**
- PrimeNG Dialog for creating sujeto when CUIT not found
- Header: "Registrar Nuevo Dueño"
- Fields: CUIT (readonly), Nombre del Dueño
- Model input for visibility

**AutomotorFormPageComponent** (container)
- Determines create/edit mode from route
- **Handles CUIT validation on blur** → calls GET /sujetos/by-cuit
  - If exists → shows denominacion in readonly field
  - If not exists → opens SujetoDialog
- After sujeto creation → updates denominacion field
- Routes: `/automotores/new`, `/automotores/:dominio/edit`

### Phase 6: Routing & Polish

1. **Configure routes**
   - Root redirects to `/automotores`
   - Lazy load automotores feature

2. **Update app.component.html**
   - Add Toast component
   - Add ConfirmDialog component
   - Clean up default template

3. **Test full CRUD flow**

## Key Files to Modify/Create

| File | Action |
|------|--------|
| `frontend/package.json` | Add primeng dependencies |
| `frontend/src/app/app.config.ts` | Configure providers with both interceptors |
| `frontend/src/app/app.routes.ts` | Add routes |
| `frontend/src/app/app.component.ts` | Update template |
| `frontend/src/app/core/interceptors/api.interceptor.ts` | Base URL + error handling |
| `frontend/src/app/core/interceptors/case-transform.interceptor.ts` | snake_case → camelCase |
| `frontend/src/app/core/constants/error-messages.ts` | Error code translations |
| `frontend/src/app/shared/**` | Create validators |
| `frontend/src/app/features/automotores/**` | Create feature module |

## Technical Decisions

- **PrimeNG** for UI components (quick CRUD, consistent design)
- **Signals** for all state management (per CLAUDE.md guidelines)
- **Standalone components** exclusively (Angular 21 pattern)
- **Native control flow** (`@if`, `@for`) in templates
- **`inject()`** over constructor injection
- **Lazy loading** for automotores feature
- **Case transformation**: Backend sends snake_case, frontend uses camelCase
  - Only responses are transformed (requests stay in camelCase as backend expects)
- **Error handling**: Use errorCode mapping for Spanish messages (backend messages are in English)
- **CUIT validation flow**: On field blur, not on form submit
  - More user-friendly, matches Oracle Forms original behavior (WHEN-VALIDATE-ITEM trigger)

## API Communication

### Backend → Frontend (Responses)
```
Backend sends:        { fecha_fabricacion, dueno_actual, ... }
Interceptor converts: { fechaFabricacion, duenoActual, ... }
Frontend uses:        camelCase models
```

### Frontend → Backend (Requests)
```
Frontend sends:       { fechaFabricacion, cuitDueno, ... }
Backend receives:     { fechaFabricacion, cuitDueno, ... } (expects camelCase)
```

### Error Handling
```
Backend sends:        { statusCode: 404, errorCode: "SUJETO_NOT_FOUND", ... }
Frontend maps:        errorCode → "No existe un sujeto con ese CUIT"
```

## CUIT Validation Flow (Updated)

```
1. User enters CUIT in masked field (99-99999999-9)
2. Client-side validation (format + module 11)
3. On blur (field loses focus):
   a. Call GET /sujetos/by-cuit?cuit=XXXXXXXXXXX
   b. If 200 OK → Show denominacion in "Nombre del Dueño" field
   c. If 404 SUJETO_NOT_FOUND → Open "Registrar Nuevo Dueño" dialog
4. In dialog: User enters nombre del dueño
5. POST /sujetos → Create sujeto
6. Update "Nombre del Dueño" field with new denominacion
7. User continues filling form
8. On submit → POST/PUT /automotores
```

## Validation Details

### CUIT Module 11 Algorithm

```typescript
const coefficients = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
let sum = 0;
for (let i = 0; i < 10; i++) {
  sum += parseInt(cuit[i], 10) * coefficients[i];
}
let checkDigit = 11 - (sum % 11);
if (checkDigit === 11) checkDigit = 0;
if (checkDigit === 10) checkDigit = 9;
return checkDigit === parseInt(cuit[10], 10);
```

### CUIT Validator (with mask support)

```typescript
// Strips non-numeric characters before validation
const value = String(control.value).replace(/\D/g, '');
```

## Error Messages Mapping

```typescript
const ERROR_MESSAGES: Record<string, string> = {
  AUTOMOTOR_NOT_FOUND: 'El automotor no fue encontrado',
  SUJETO_NOT_FOUND: 'No existe un sujeto con ese CUIT',
  CUIT_ALREADY_EXISTS: 'Ya existe un sujeto con ese CUIT',
  BAD_REQUEST: 'Los datos enviados no son válidos',
  VALIDATION_ERROR: 'Los datos ingresados no son válidos',
  // ... more codes
};
```

## Verification

1. Run `npm install` in frontend
2. Start backend: `cd backend && npm run start:dev`
3. Start frontend: `cd frontend && npm start`
4. Test list page loads at http://localhost:4200
5. Test create flow with valid data
6. **Test CUIT blur validation** with existing CUIT (should show name)
7. **Test CUIT blur validation** with non-existent CUIT (should show dialog)
8. Test edit flow
9. Test delete flow
10. Test all validation errors display correctly in Spanish
