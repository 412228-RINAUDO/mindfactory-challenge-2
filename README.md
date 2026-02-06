# Automotores - Challenge Técnico

Sistema de gestión de automotores con asignación de dueños por CUIT.

**Stack:** NestJS + TypeORM + PostgreSQL + Angular 21 + PrimeNG

---

## Requisitos

- **Docker Desktop** - [Descargar aquí](https://www.docker.com/products/docker-desktop/)

---

## Levantar la Aplicación

### Paso 1: Clonar el repositorio

```bash
git clone https://github.com/usuario/automotores-challenge.git
```

### Paso 2: Entrar al proyecto

```bash
cd automotores-challenge
```

### Paso 3: Levantar los servicios

```bash
docker compose up -d --build
```

> Esperar unos minutos mientras se construyen las imágenes y se inician los servicios.

### Paso 4: Verificar que todo está corriendo

```bash
docker compose ps
```

Deberías ver 4 servicios con estado `healthy`:
- `automotores_db` (PostgreSQL)
- `automotores_api` (Backend)
- `automotores_web` (Frontend)
- `automotores_adminer` (Admin DB)

### Paso 5: Abrir la aplicación

| Servicio | URL |
|----------|-----|
| **Frontend** | http://localhost:4200 |
| **API** | http://localhost:3000/api |
| **Swagger (API Docs)** | http://localhost:3000/api/docs |
| **Adminer (DB Admin)** | http://localhost:8080 |

---

## Detener la Aplicación

```bash
docker compose down
```

Para eliminar también los datos de la base de datos:

```bash
docker compose down -v
```

---

## Credenciales

### Base de Datos (PostgreSQL)

| Campo | Valor |
|-------|-------|
| Host | `localhost` |
| Puerto | `5432` |
| Usuario | `postgres` |
| Password | `postgres` |
| Base de datos | `automotores` |

### Adminer (para conectarse desde http://localhost:8080)

| Campo | Valor |
|-------|-------|
| Sistema | PostgreSQL |
| Servidor | `db` |
| Usuario | `postgres` |
| Contraseña | `postgres` |
| Base de datos | `automotores` |

---

## Correr Tests

### Tests Unitarios (Backend)

```bash
cd backend
pnpm install
pnpm test
```

### Tests E2E (Backend)

> Requiere Docker corriendo. Los tests usan [Testcontainers](https://testcontainers.com/) para levantar automáticamente un contenedor de PostgreSQL y eliminarlo al finalizar.

```bash
cd backend
pnpm test:e2e
```

---

## Endpoints Principales

### Automotores

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/automotores` | Listar automotores con dueño |
| GET | `/api/automotores/:dominio` | Detalle por patente |
| POST | `/api/automotores` | Crear automotor |
| PUT | `/api/automotores/:dominio` | Actualizar automotor |
| DELETE | `/api/automotores/:dominio` | Eliminar automotor |

### Sujetos (Dueños)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/sujetos/by-cuit?cuit=XXX` | Buscar por CUIT |
| POST | `/api/sujetos` | Crear sujeto |

---

## Validaciones

| Campo | Regla |
|-------|-------|
| Dominio | `AAA999` o `AA999AA` |
| CUIT | 11 dígitos + dígito verificador (módulo 11) |
| Fecha Fabricación | `YYYYMM`, mes 1-12, no futuro |
