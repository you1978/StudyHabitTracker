import type { Express, Request, Response, NextFunction } from 'express';

interface CorsOptions {
  origin: string[] | string | ((origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void);
  credentials?: boolean;
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

export function setupCors(app: Express, options: CorsOptions) {
  const {
    origin,
    credentials = false,
    methods = ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders = ['Content-Type', 'Authorization'],
    exposedHeaders = [],
    maxAge = 86400,
    preflightContinue = false,
    optionsSuccessStatus = 204
  } = options;

  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestOrigin = req.headers.origin;

    // Skip CORS for same-origin requests
    if (!requestOrigin) {
      return next();
    }

    // Handle origin
    if (typeof origin === 'function') {
      origin(requestOrigin, (err, allow) => {
        if (err) {
          return next(err);
        }
        if (allow) {
          res.setHeader('Access-Control-Allow-Origin', requestOrigin);
        }
      });
    } else if (typeof origin === 'string') {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (Array.isArray(origin)) {
      if (origin.includes(requestOrigin)) {
        res.setHeader('Access-Control-Allow-Origin', requestOrigin);
      }
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    // Handle credentials
    if (credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', methods.join(','));
      res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(','));
      
      if (exposedHeaders.length > 0) {
        res.setHeader('Access-Control-Expose-Headers', exposedHeaders.join(','));
      }
      
      if (maxAge) {
        res.setHeader('Access-Control-Max-Age', maxAge.toString());
      }

      if (!preflightContinue) {
        return res.sendStatus(optionsSuccessStatus);
      }
    }

    next();
  });
}