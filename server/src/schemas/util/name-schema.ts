import z from 'zod';

export default function nameSchema(fieldName: string) {
  return z
    .string()
    .trim()
    .min(1, `${fieldName} is required`)
    .max(255, `${fieldName} must be at most 255 characters`)
    .regex(
      /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/,
      `${fieldName} contains invalid characters`,
    );
}
