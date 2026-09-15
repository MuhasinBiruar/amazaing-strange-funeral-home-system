import z from 'zod';

const regex = /^-?\d+(\.\d+)?$/;

export const bigNumberSchema = z
  .string()
  .regex(regex, {
    error: 'Must be a valid numeric string',
  })
  .refine((val) => !isNaN(Number(val)) || val.length > 0, {
    message: 'Invalid number format',
  });
