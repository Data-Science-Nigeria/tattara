import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(TypeOrmExceptionFilter.name);

  catch(
    exception: QueryFailedError & { code?: string; detail?: string },
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error occurred';

    switch (exception.code) {
      case '23505': // unique violation
        status = HttpStatus.CONFLICT;
        message =
          this.extractFieldFromDetail(exception.detail) ||
          'Duplicate value violates unique constraint';
        break;

      case '23503': // foreign key violation
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid reference: foreign key constraint failed';
        break;
    }

    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - Error: ${message}`,
      exception.stack,
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
    });
  }

  private extractFieldFromDetail(detail?: string): string | null {
    if (!detail) return null;
    const match = detail.match(/\(([^)]+)\)=/);
    if (match) {
      return `Duplicate value for field -> ${match[1]}`;
    }
    return null;
  }
}
