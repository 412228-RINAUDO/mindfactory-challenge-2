/**
 * Mapping of backend error codes to user-friendly Spanish messages.
 */
export const ERROR_MESSAGES: Record<string, string> = {
  // Automotores
  AUTOMOTOR_NOT_FOUND: 'El automotor no fue encontrado',
  AUTOMOTOR_ALREADY_EXISTS: 'Ya existe un automotor con ese dominio',

  // Sujetos
  SUJETO_NOT_FOUND: 'No existe un sujeto con ese CUIT',
  CUIT_ALREADY_EXISTS: 'Ya existe un sujeto con ese CUIT',

  // Validation
  VALIDATION_ERROR: 'Los datos ingresados no son válidos',
  BAD_REQUEST: 'Los datos enviados no son válidos',

  // Generic
  NOT_FOUND: 'El recurso solicitado no fue encontrado',
  INTERNAL_SERVER_ERROR: 'Ocurrió un error inesperado en el servidor',
  UNAUTHORIZED: 'No está autorizado para realizar esta acción',
  FORBIDDEN: 'No tiene permisos para realizar esta acción',
};

/**
 * Default message when error code is not mapped.
 */
export const DEFAULT_ERROR_MESSAGE = 'Ocurrió un error inesperado';

/**
 * Gets the user-friendly message for an error code.
 */
export function getErrorMessageByCode(errorCode: string | undefined): string {
  if (!errorCode) return DEFAULT_ERROR_MESSAGE;
  return ERROR_MESSAGES[errorCode] ?? DEFAULT_ERROR_MESSAGE;
}
