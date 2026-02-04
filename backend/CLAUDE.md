# Backend Agent Instructions - NestJS 11 + TypeORM + PostgreSQL

## Tech Stack

- **Framework**: NestJS 11.x
- **ORM**: TypeORM
- **Database**: PostgreSQL 16
- **Validation**: class-validator + class-transformer
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest

---

## ⛔ CRITICAL DEVELOPMENT RULES

### 🚫 USAGE OF `any` IS FORBIDDEN

**NEVER, UNDER ANY CIRCUMSTANCES, USE THE `any` TYPE.**

This is an **UNBREAKABLE** rule. All code must have strict typing.

```typescript
// ❌ FORBIDDEN - NEVER DO THIS
function processData(data: any): any { ... }
const result: any = someFunction();
catch (error: any) { ... }

// ✅ CORRECT - ALWAYS TYPE EXPLICITLY
function processData(data: UserDto): UserResponseDto { ... }
const result: User = someFunction();
catch (error: unknown) {
  if (error instanceof Error) { ... }
}
```

**Alternatives to `any`:**
- Use `unknown` when the type is not known, then do type narrowing
- Create specific interfaces/types for each data structure
- Use generics `<T>` when flexibility with type safety is needed
- Use union types `string | number` when multiple types are possible

---

## 🏗️ LAYERED ARCHITECTURE: Controller → Service → Repository

**MANDATORY** to follow the 3-layer separation pattern. Each layer has specific responsibilities and MUST NOT be mixed.

```
┌─────────────────────────────────────────────────────────────┐
│                        CONTROLLER                           │
│  - Receives HTTP requests                                   │
│  - Validates input DTOs                                     │
│  - Calls the Service                                        │
│  - Returns HTTP responses                                   │
│  - Does NOT contain business logic                          │
│  - Does NOT access the database directly                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         SERVICE                             │
│  - Contains ALL business logic                              │
│  - Orchestrates operations between repositories             │
│  - Handles transactions                                     │
│  - Throws business exceptions (422)                         │
│  - Does NOT know about HTTP (requests/responses)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       REPOSITORY                            │
│  - EXCLUSIVE access to the database                         │
│  - Queries and CRUD operations                              │
│  - Entity ↔ database mapping                                │
│  - Does NOT contain business logic                          │
│  - Does NOT know about DTOs (works with entities)           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔌 DEPENDENCY INVERSION: Interfaces for Repositories

**MANDATORY**: Each Repository must have an **Interface** that defines its contract. The Service injects the **Interface**, NOT the concrete class.

**Benefits:**
- ✅ **Testability**: Easy mocking in unit tests
- ✅ **Decoupling**: The Service doesn't know the implementation
- ✅ **SOLID**: Complies with Dependency Inversion Principle (DIP)

### Mandatory Pattern

```
┌─────────────────┐      ┌─────────────────────┐
│     SERVICE     │ ───► │   IUserRepository   │  (Interface)
└─────────────────┘      └─────────────────────┘
                                   ▲
                                   │ implements
                         ┌─────────────────────┐
                         │   UserRepository    │  (Concrete class)
                         └─────────────────────┘
```

### Implementation Example

```typescript
// 1. INTERFACE
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface IUserRepository {
  create(data: CreateUserData): Promise<User>;
  findById(id: number): Promise<User | null>;
  findAll(): Promise<User[]>;
}

// 2. REPOSITORY (implements interface)
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async create(data: CreateUserData): Promise<User> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }
  // ...
}

// 3. SERVICE (injects interface)
@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}
}

// 4. MODULE (registers provider with token)
@Module({
  providers: [
    UserService,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
  ],
})
export class UserModule {}
```

---

## Project Structure

```
src/
├── common/
│   ├── decorators/           # Custom decorators
│   ├── exceptions/           # Business exceptions
│   ├── filters/              # Exception filters
│   ├── interceptors/         # Response interceptors
│   ├── interfaces/           # Shared interfaces
│   ├── pipes/                # Custom validation pipes
│   └── validators/           # Custom validators
├── config/
│   ├── database.config.ts
│   └── app.config.ts
├── modules/
│   └── [module-name]/
│       ├── controllers/
│       │   ├── [name].controller.ts
│       │   └── [name].controller.spec.ts
│       ├── services/
│       │   ├── [name].service.ts
│       │   └── [name].service.spec.ts
│       ├── repositories/
│       │   ├── [name].repository.ts
│       │   └── [name].repository.spec.ts
│       ├── interfaces/
│       │   └── [name]-repository.interface.ts
│       ├── entities/
│       │   └── [name].entity.ts
│       ├── dto/
│       │   ├── create-[name].dto.ts
│       │   ├── update-[name].dto.ts
│       │   └── [name]-response.dto.ts
│       └── [name].module.ts
├── database/
│   ├── migrations/
│   └── seeds/
├── app.module.ts
└── main.ts
```

### File Responsibilities

| File | Responsibility |
|------|----------------|
| `*.controller.ts` | HTTP req/res, DTO validation |
| `*.service.ts` | Business logic, transactions |
| `*-repository.interface.ts` | Repository contract |
| `*.repository.ts` | Implements interface, DB access |
| `*.entity.ts` | Table ↔ object mapping |
| `*.dto.ts` | Input/output validation |
| `*.spec.ts` | Unit test for the file |

---

## 🧪 Test Location: Co-located

**MANDATORY**: Test files must be **next to the file they test**, NOT in a separate directory.

```
# ✅ CORRECT - Test next to the file in its folder
users/
├── controllers/
│   ├── users.controller.ts
│   └── users.controller.spec.ts    ← Next to the file
├── services/
│   ├── users.service.ts
│   └── users.service.spec.ts       ← Next to the file
└── repositories/
    ├── users.repository.ts
    └── users.repository.spec.ts    ← Next to the file

# ❌ INCORRECT - Do NOT use separate __tests__ folder
users/
├── services/
│   └── users.service.ts
└── __tests__/
    └── users.service.spec.ts
```

---

## Error Handling

For business rule errors, use `HttpStatus.UNPROCESSABLE_ENTITY` (422):

```typescript
import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessRuleException extends HttpException {
  constructor(message: string, errors?: Record<string, string[]>) {
    super(
      {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message,
        errors,
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
```

---

## Swagger Documentation (Mandatory)

All endpoints and DTOs **MUST** be documented with Swagger decorators.

### Controller Decorators

```typescript
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('users')  // Groups endpoints in Swagger UI
@Controller('users')
export class UsersController {

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID', example: 1 })
  @ApiResponse({ status: 200, description: 'User found', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: number): Promise<UserResponseDto> {
    // ...
  }

  @Get()
  @ApiOperation({ summary: 'List all users' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiResponse({ status: 200, description: 'Users list', type: [UserResponseDto] })
  async findAll(): Promise<UserResponseDto[]> {
    // ...
  }

  @Post()
  @ApiOperation({ summary: 'Create user' })
  @ApiResponse({ status: 201, description: 'User created', type: UserResponseDto })
  @ApiResponse({ status: 422, description: 'Validation error' })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    // ...
  }
}
```

### DTO Decorators

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    minLength: 2,
    maxLength: 100,
  })
  name: string;

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+1234567890',
  })
  phone?: string;
}
```

### Response DTO Example

```typescript
export class UserResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;
}
```

### Rules

- Every controller must have `@ApiTags()`
- Every endpoint must have `@ApiOperation()` with a summary
- Every endpoint must document possible responses with `@ApiResponse()`
- Every DTO property must have `@ApiProperty()` or `@ApiPropertyOptional()`
- Always include `example` values for better documentation

---

## Code Conventions

### Naming
| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `user.entity.ts` |
| Classes | PascalCase | `UserService` |
| Methods/Variables | camelCase | `findById` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| DTOs | Suffix `Dto` | `CreateUserDto` |
| Repositories | Suffix `Repository` | `UserRepository` |
| Interfaces | Prefix `I` | `IUserRepository` |
| Commits | Conventional Commits | `feat(api): add users CRUD` |

### Comments Language

**All comments MUST be written in English. Never in Spanish or any other language.**

```typescript
// ✅ CORRECT
// Validate user permissions before proceeding
// TODO: Implement caching for better performance

// ❌ INCORRECT
// Validar permisos del usuario antes de continuar
// TODO: Implementar cache para mejor rendimiento
```

This applies to:
- Inline comments (`//`)
- Block comments (`/* */`)
- JSDoc comments (`/** */`)
- TODO/FIXME comments
- Swagger descriptions

### Strict Typing

```typescript
// ✅ Always type parameters and return values
async findById(id: number): Promise<User | null>

// ✅ Type arrays explicitly
const users: User[] = await this.repository.find();

// ✅ Type errors as unknown
catch (error: unknown) {
  if (error instanceof QueryFailedError) { ... }
}
```

### Conventional Commits (Mandatory)

All commits **MUST** follow the [Conventional Commits](https://www.conventionalcommits.org/) format. This is enforced by `commitlint` via git hooks.

**Format:**
```
<type>(<scope>): <subject>

[optional body]
```

**Allowed types:**
| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting (no code change) |
| `refactor` | Code refactoring |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks |
| `perf` | Performance improvement |
| `ci` | CI/CD changes |
| `build` | Build system changes |
| `revert` | Revert previous commit |

**Examples:**
```bash
# ✅ CORRECT
feat(api): add user authentication
fix(users): resolve null pointer in findById
docs: update README with setup instructions
refactor(services): extract validation logic

# ❌ INCORRECT
added new feature
Fix bug
UPDATE: users module
```

**Rules:**
- Subject must be lowercase
- Subject must not be empty
- Type must not be empty
- No period at the end of subject

---

## Strict TypeScript Configuration

`tsconfig.json` must include:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

---

## Base Dependencies

```bash
pnpm add @nestjs/typeorm typeorm pg
pnpm add @nestjs/config
pnpm add @nestjs/swagger
pnpm add class-validator class-transformer
```

---

## References

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [class-validator](https://github.com/typestack/class-validator)
