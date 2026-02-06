import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs';

/**
 * Converts a snake_case string to camelCase.
 * Example: fecha_fabricacion -> fechaFabricacion
 */
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

/**
 * Recursively transforms all object keys using the provided transform function.
 * Handles arrays, nested objects, and preserves null/undefined/Date values.
 */
function transformKeys(
  obj: unknown,
  transformFn: (key: string) => string,
): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => transformKeys(item, transformFn));
  }

  if (obj instanceof Date) {
    return obj;
  }

  if (typeof obj === 'object') {
    const transformed: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const newKey = transformFn(key);
      transformed[newKey] = transformKeys(value, transformFn);
    }
    return transformed;
  }

  return obj;
}

/**
 * HTTP Interceptor that transforms response bodies from snake_case to camelCase.
 *
 * The backend's SnakeCaseInterceptor converts responses to snake_case,
 * but expects requests in camelCase. This interceptor only transforms
 * responses to allow the frontend to use standard JS/TS camelCase conventions.
 */
export const caseTransformInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    map((event) => {
      // Transform response body from snake_case to camelCase
      if (event instanceof HttpResponse && event.body) {
        const transformedBody = transformKeys(event.body, toCamelCase);
        return event.clone({ body: transformedBody });
      }
      return event;
    }),
  );
};
