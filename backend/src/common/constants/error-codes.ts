export const ErrorCodes = {
  // Automotores
  AUTOMOTOR_NOT_FOUND: 'AUTOMOTOR_NOT_FOUND',

  // Sujetos
  SUJETO_NOT_FOUND: 'SUJETO_NOT_FOUND',

  // Generic
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
