/**
 * Normalises an empty form value to `null`.
 *
 * @remarks
 * The shared insert schemas wrap optional text fields in `withNullDefault(
 * z.string().min(1))`, which accepts `null` but rejects `''`. Blank inputs must
 * therefore be converted before being sent, or the server answers 400.
 */
export default function emptyToNull(
  value: FormDataEntryValue | null,
): string | null {
  return value ? (value as string) : null;
}
