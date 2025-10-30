/**
 * Security middleware for the API
 * Includes CORS, rate limiting, and request logging
 */

import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { config } from '@/config';
import { logger } from '@/lib/logger';
import { RateLimitError } from './errorHandler';

// CORS configuration
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // In development, be more permissive
    if (config.nodeEnv === 'development') {
      // Allow localhost on any port
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
    }
    
    // Allow configured origins
    const allowedOrigins = config.corsOrigin.split(',').map(o => o.trim());
    
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'X-Rate-Limit-Remaining'],
});

// Security headers
export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.mainnet-beta.solana.com'],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// Rate limiting configuration
const createRateLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message,
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      throw new RateLimitError();
    },
  });
};

// Different rate limits for different endpoints
export const generalRateLimit = createRateLimiter(
  config.rateLimitWindowMs,
  config.rateLimitMaxRequests,
  'Too many requests from this IP'
);

export const flagSubmissionRateLimit = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  10, // 10 flag submissions per 15 minutes
  'Too many flag submissions from this IP'
);

export const webhookRateLimit = createRateLimiter(
  60 * 1000, // 1 minute
  1000, // 1000 webhook calls per minute
  'Too many webhook calls'
);

// Request ID middleware
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.headers['x-request-id'] as string || 
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  next();
};

// Request logging middleware
export const requestLoggingMiddleware = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  {
    stream: {
      write: (message: string) => {
        logger.info(message.trim(), { type: 'http_request' });
      },
    },
    skip: (req: Request) => {
      // Skip logging for health check endpoints in production
      return config.nodeEnv === 'production' && req.url === '/health';
    },
  }
);

// IP extraction middleware (for rate limiting behind proxies)
export const ipMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Trust proxy headers in production
  if (config.nodeEnv === 'production') {
    const forwarded = req.headers['x-forwarded-for'] as string;
    const realIp = req.headers['x-real-ip'] as string;
    
    if (forwarded) {
      req.ip = forwarded.split(',')[0].trim();
    } else if (realIp) {
      req.ip = realIp;
    }
  }
  
  next();
};

// Content type validation middleware
export const validateContentType = (expectedType: string = 'application/json') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method === 'GET' || req.method === 'DELETE') {
      return next();
    }
    
    const contentType = req.headers['content-type'];
    
    if (!contentType || !contentType.includes(expectedType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONTENT_TYPE',
          message: `Expected content type: ${expectedType}`,
        },
      });
    }
    
    next();
  };
};

// Request size limit middleware
export const requestSizeLimit = (limit: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = req.headers['content-length'];
    
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024);
      const limitInMB = parseInt(limit.replace('mb', ''));
      
      if (sizeInMB > limitInMB) {
        return res.status(413).json({
          success: false,
          error: {
            code: 'REQUEST_TOO_LARGE',
            message: `Request size exceeds ${limit} limit`,
          },
        });
      }
    }
    
    next();
  };
};
