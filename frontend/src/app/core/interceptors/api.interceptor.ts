import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

const API_BASE_URL = 'http://localhost:3000/api/';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  const apiReq = req.clone({
    url: req.url.startsWith('http') ? req.url : `${API_BASE_URL}${req.url}`,
  });

  return next(apiReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 0) {
        notificationService.error(
          'Error de conexión',
          'No se pudo conectar con el servidor',
        );
      } else if (error.status >= 500) {
        notificationService.error(
          'Error del servidor',
          'Ocurrió un error inesperado',
        );
      }
      return throwError(() => error);
    }),
  );
};
