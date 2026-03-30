// ============================================
// CalApp01 — Input Validation Middleware
// ============================================
// AGENT_INSTRUCTION:
// Использует Zod для валидации тела запроса.
// Пример использования:
//   router.post('/register', validate(registerSchema), handler);

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware для валидации тела запроса через Zod-схему
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        res.status(400).json({ error: 'Ошибка валидации', details: messages });
        return;
      }
      next(error);
    }
  };
}

/**
 * Middleware для валидации query-параметров
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        res.status(400).json({ error: 'Ошибка валидации параметров', details: messages });
        return;
      }
      next(error);
    }
  };
}
