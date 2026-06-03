import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

type Schemas = {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
};

export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (schemas.body) req.body = schemas.body.parse(req.body) as unknown;
    if (schemas.query) req.validatedQuery = schemas.query.parse(req.query);
    if (schemas.params) req.validatedParams = schemas.params.parse(req.params);
    next();
  };
}
