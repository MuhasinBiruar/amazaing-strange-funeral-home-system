import { z } from "zod";
import { Request, Response, NextFunction } from "express";

/**
 * Validate middleware using Zod.
 *
 * @param schema Zod schema to validate the request body against.
 * @returns Express middleware function.
 */
export default function validate<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request body",
        errors: z.treeifyError(result.error),
      });
    }

    req.body = result.data;
    next();
  };
}