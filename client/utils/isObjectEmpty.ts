export default function isObjectEmpty(
  obj: unknown,
): obj is Record<string, never> {
  // Ensure it is a non-null object and a plain Object instance
  if (!obj || typeof obj !== 'object' || obj.constructor !== Object)
    return false;

  for (const key in obj) if (Object.hasOwn(obj, key)) return false;

  return true;
}
