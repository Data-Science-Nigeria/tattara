import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export const ApiSuccessResponse = (description: string, type?: any) =>
  applyDecorators(
    ApiResponse({
      status: 200,
      description,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      type,
    }),
  );

export const ApiErrorResponse = (status: number, description: string) =>
  applyDecorators(
    ApiResponse({
      status,
      description,
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number' },
          timestamp: { type: 'string' },
          path: { type: 'string' },
          method: { type: 'string' },
          message: { type: 'string' },
          errors: { type: 'object' },
        },
      },
    }),
  );
