/**
 * Global error handling middleware
 * Provides consistent error responses and logging
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';
import { ApiError, ApiResponse } from '@/types';

// Custom error class for API errors
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Predefined error types
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super('Too many requests', 429, 'RATE_LIMIT_EXCEEDED');
  }
}

// Error handler middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let apiError: ApiError;

  // Handle different error types
  if (error instanceof AppError) {
    // Custom application errors
    apiError = {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
    };
  } else if (error instanceof ZodError) {
    // Zod validation errors
    apiError = {
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      statusCode: 400,
      details: {
        issues: error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        })),
      },
    };
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Prisma database errors
    switch (error.code) {
      case 'P2002':
        apiError = {
          code: 'DUPLICATE_ENTRY',
          message: 'A record with this data already exists',
          statusCode: 409,
          details: { field: error.meta?.target },
        };
        break;
      case 'P2025':
        apiError = {
          code: 'NOT_FOUND',
          message: 'Record not found',
          statusCode: 404,
        };
        break;
      default:
        apiError = {
          code: 'DATABASE_ERROR',
          message: 'Database operation failed',
          statusCode: 500,
          details: { code: error.code },
        };
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    // Prisma validation errors
    apiError = {
      code: 'DATABASE_VALIDATION_ERROR',
      message: 'Invalid data provided to database',
      statusCode: 400,
    };
  } else {
    // Unknown errors
    apiError = {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      statusCode: 500,
    };
  }

  // Log error details
  logger.error('API Error', {
    error: {
      message: error.message,
      stack: error.stack,
      code: apiError.code,
      statusCode: apiError.statusCode,
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    },
  });

  // Send error response
  const response: ApiResponse = {
    success: false,
    error: {
      code: apiError.code,
      message: apiError.message,
      details: apiError.details,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string,
      version: 'v1',
    },
  };

  res.status(apiError.statusCode).json(response);
};

// 404 handler for unmatched routes
export const notFoundHandler = (req: Request, res: Response): void => {
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
  };

  res.status(404).json(response);
};

// Async error wrapper for route handlers
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};




