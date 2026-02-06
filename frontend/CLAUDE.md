# Frontend Development Guidelines

## Angular Version

This project uses **Angular 21.x** (the latest stable version). All implementations must leverage the most recent framework features.

## UI Library - PrimeNG (MANDATORY)

**PrimeNG is the ONLY allowed UI component library for this project.**

All UI components must use PrimeNG. Do NOT use:
- Raw HTML elements for complex UI (tables, dialogs, forms, buttons)
- Other UI libraries (Angular Material, Bootstrap, etc.)
- Custom CSS-only solutions for components that PrimeNG provides

```typescript
// ✅ CORRECT - Use PrimeNG components
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

// ❌ FORBIDDEN - Raw HTML for complex UI
<table>...</table>  // Use <p-table> instead
<button>...</button>  // Use <p-button> instead
<dialog>...</dialog>  // Use <p-dialog> instead
```

## Component File Structure (MANDATORY)

**All components MUST use separate template files. Inline templates are FORBIDDEN.**

Each component must have:
- `component-name.component.ts` - Component class with `templateUrl`
- `component-name.component.html` - Template file

```typescript
// ✅ CORRECT - External template file
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './example.component.html',
})
export class ExampleComponent {}

// ❌ FORBIDDEN - Inline template
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule],
  template: `<div>...</div>`,  // NEVER do this
})
export class ExampleComponent {}
```

### Component Folder Structure

```
components/
└── user-list/
    ├── user-list.component.ts      # Component class
    └── user-list.component.html    # Template (REQUIRED)
```

## Modern Angular 21 Features

### Signals (Reactive System)

Use Signals as the primary reactivity system:

```typescript
import { signal, computed, effect } from '@angular/core';

// Reactive state
readonly count = signal(0);

// Derived values
readonly doubleCount = computed(() => this.count() * 2);

// Side effects
constructor() {
  effect(() => {
    console.log(`Count changed to: ${this.count()}`);
  });
}
```

### Standalone Components (Required)

All components, directives, and pipes must be standalone:

```typescript
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule],
  templateUrl: './example.component.html',
})
export class ExampleComponent {}
```

### Native Control Flow

Use the new control flow syntax in templates:

```html
<!-- Conditionals -->
@if (isLoading()) {
  <p-progressSpinner />
} @else if (hasError()) {
  <p-message severity="error" [text]="errorMessage()" />
} @else {
  <app-content [data]="data()" />
}

<!-- Iterations -->
@for (item of items(); track item.id) {
  <app-item [item]="item" />
} @empty {
  <p>No items found</p>
}

<!-- Switch -->
@switch (status()) {
  @case ('loading') { <p-progressSpinner /> }
  @case ('error') { <p-message severity="error" text="Error" /> }
  @default { <app-content /> }
}
```

### Defer Blocks (Template Lazy Loading)

```html
@defer (on viewport) {
  <app-heavy-component />
} @placeholder {
  <p-skeleton />
} @loading (minimum 500ms) {
  <p-progressSpinner />
} @error {
  <p-message severity="error" text="Failed to load" />
}
```

### Signal Inputs and Outputs

```typescript
// Signal Inputs (replace @Input)
readonly userId = input.required<string>();
readonly title = input<string>('Default Title');

// Model Inputs (two-way binding)
readonly value = model<string>('');

// Signal Outputs (replace @Output)
readonly userSelected = output<User>();
readonly cancelled = output<void>();
```

### Inject Function

Prefer `inject()` over constructor injection:

```typescript
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
}
```

### viewChild and contentChild with Signals

```typescript
readonly inputElement = viewChild<ElementRef>('inputRef');
readonly requiredInput = viewChild.required<ElementRef>('requiredRef');
readonly contentItems = contentChildren<ItemComponent>(ItemComponent);
```

## Modular Architecture

### Folder Structure

```
src/
├── app/
│   ├── core/                    # Singleton services, guards, interceptors
│   │   ├── services/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   └── models/
│   ├── shared/                  # Reusable components, pipes, directives
│   │   ├── components/
│   │   ├── directives/
│   │   └── pipes/
│   ├── features/                # Feature modules
│   │   ├── feature-a/
│   │   │   ├── components/
│   │   │   │   └── component-name/
│   │   │   │       ├── component-name.component.ts
│   │   │   │       └── component-name.component.html
│   │   │   ├── services/
│   │   │   ├── models/
│   │   │   └── feature-a.routes.ts
│   │   └── feature-b/
│   └── app.routes.ts
├── environments/
└── styles/
```

### Feature Lazy Loading

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: 'feature-a',
    loadChildren: () =>
      import('./features/feature-a/feature-a.routes').then(
        (m) => m.FEATURE_A_ROUTES
      ),
  },
];
```

## Strict Typing - ZERO ANY

### Absolute Rule: No `any` Allowed

The use of `any` is **FORBIDDEN** throughout the entire project. There are no exceptions.

### TypeScript Configuration (Already Applied)

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noFallthroughCasesInSwitch": true
  },
  "angularCompilerOptions": {
    "strictTemplates": true,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true
  }
}
```

### Alternatives to `any`

```typescript
// BAD - FORBIDDEN
function process(data: any): any { ... }

// GOOD - Use specific types
function process(data: UserData): ProcessedResult { ... }

// GOOD - Use generics
function process<T extends BaseEntity>(data: T): ProcessedEntity<T> { ... }

// GOOD - Use unknown when type is uncertain
function parseResponse(data: unknown): ParsedData {
  if (isValidData(data)) {
    return data as ParsedData;
  }
  throw new Error('Invalid data');
}

// GOOD - Use Record for dynamic objects
const config: Record<string, string | number | boolean> = {};

// GOOD - Use union types
type ApiResponse = SuccessResponse | ErrorResponse;

// GOOD - Use type guards
function isUser(obj: unknown): obj is User {
  return typeof obj === 'object' && obj !== null && 'id' in obj && 'name' in obj;
}
```

### Interfaces and Types

Define interfaces for all data structures:

```typescript
// models/user.model.ts
export interface User {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly createdAt: Date;
}

export interface CreateUserRequest {
  readonly email: string;
  readonly name: string;
  readonly password: string;
}

export interface ApiResponse<T> {
  readonly data: T;
  readonly meta: ResponseMeta;
}
```

### HttpClient with Types

```typescript
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/users';

  getUsers(): Observable<User[]> {
    return this.http.get<ApiResponse<User[]>>(this.apiUrl).pipe(
      map((response) => response.data)
    );
  }

  getUser(id: string): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/${id}`).pipe(
      map((response) => response.data)
    );
  }
}
```

## Recommended Patterns

### Services with Signals

```typescript
@Injectable({ providedIn: 'root' })
export class UserStateService {
  // Private state
  private readonly _users = signal<User[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Public read-only state
  readonly users = this._users.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed values
  readonly userCount = computed(() => this._users().length);

  async loadUsers(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const users = await firstValueFrom(this.userService.getUsers());
      this._users.set(users);
    } catch (error) {
      this._error.set(this.getErrorMessage(error));
    } finally {
      this._loading.set(false);
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }
}
```

### Smart vs Presentational Components

```typescript
// user-list-container.component.ts (Smart Component)
@Component({
  selector: 'app-user-list-container',
  standalone: true,
  imports: [UserListComponent],
  templateUrl: './user-list-container.component.html',
})
export class UserListContainerComponent {
  protected readonly userState = inject(UserStateService);

  protected onUserSelected(user: User): void {
    // Handle selection
  }
}
```

```html
<!-- user-list-container.component.html -->
<app-user-list
  [users]="userState.users()"
  [loading]="userState.loading()"
  (userSelected)="onUserSelected($event)"
/>
```

```typescript
// user-list.component.ts (Presentational Component)
@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [TableModule, ButtonModule],
  templateUrl: './user-list.component.html',
})
export class UserListComponent {
  readonly users = input.required<User[]>();
  readonly loading = input(false);
  readonly userSelected = output<User>();
}
```

```html
<!-- user-list.component.html -->
<p-table [value]="users()" [loading]="loading()">
  <ng-template #header>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Actions</th>
    </tr>
  </ng-template>
  <ng-template #body let-user>
    <tr>
      <td>{{ user.name }}</td>
      <td>{{ user.email }}</td>
      <td>
        <p-button icon="pi pi-eye" (onClick)="userSelected.emit(user)" />
      </td>
    </tr>
  </ng-template>
</p-table>
```

## Rules Summary

1. **Angular 21.x** - Use the latest stable version
2. **PrimeNG MANDATORY** - Only UI library allowed
3. **External Templates MANDATORY** - Use `templateUrl`, never inline `template`
4. **Standalone Components** - Required for all components
5. **Signals** - Primary reactivity system
6. **Native Control Flow** - @if, @for, @switch in templates
7. **Signal Inputs/Outputs** - input(), output(), model()
8. **inject()** - Prefer over constructor injection
9. **Modular Architecture** - core/, shared/, features/
10. **Lazy Loading** - For all features
11. **ZERO ANY** - Use specific types, generics, or unknown
12. **Interfaces** - Define for all data structures
