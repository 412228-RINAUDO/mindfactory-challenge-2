import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { EntityNotFoundException } from '../exceptions/entity-not-found.exception';
import { ErrorResponseDto } from '../dto/error-response.dto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, errorCode, message } = this.extractErrorInfo(exception);

    const errorResponse: ErrorResponseDto = {
      statusCode,
      errorCode,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    this.logError(request, errorResponse, message);

    response.status(statusCode).json(errorResponse);
  }

  private extractErrorInfo(exception: unknown): {
    statusCode: number;
    errorCode: string;
    message: string;
  } {
    if (exception instanceof EntityNotFoundException) {
      return {
        statusCode: exception.getStatus(),
        errorCode: exception.errorCode,
        message: exception.message,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Extract errorCode from response body if available, otherwise use default
      let errorCode = this.getDefaultErrorCode(status);
      let message = exception.message;

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        const responseObj = exceptionResponse as { message?: string; errorCode?: string };
        message = responseObj.message ?? exception.message;
        if (responseObj.errorCode) {
          errorCode = responseObj.errorCode;
        }
      }

      return {
        statusCode: status,
        errorCode,
        message,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    };
  }

  private getDefaultErrorCode(status: number): string {
    const errorCodes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      500: 'INTERNAL_SERVER_ERROR',
    };

    return errorCodes[status] ?? 'UNKNOWN_ERROR';
  }

  private logError(request: Request, errorResponse: ErrorResponseDto, message: string): void {
    const logContext: Record<string, unknown> = {
      errorCode: errorResponse.errorCode,
      statusCode: errorResponse.statusCode,
      message,
      path: request.url,
      method: request.method,
      body: request.body as unknown,
      query: request.query as unknown,
      params: request.params as unknown,
      userAgent: request.get('user-agent'),
      ip: request.ip,
    };

    if (errorResponse.statusCode >= 500) {
      this.logger.error(`[${errorResponse.errorCode}] ${message}`, JSON.stringify(logContext));
    } else {
      this.logger.warn(`[${errorResponse.errorCode}] ${message}`, JSON.stringify(logContext));
    }
  }
}
