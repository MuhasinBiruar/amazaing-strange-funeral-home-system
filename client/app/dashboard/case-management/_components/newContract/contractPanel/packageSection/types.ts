import type { CreatePackageQuery } from 'shared';
import emptyToNull from '@/utils/emptyToNull';

export const PACKAGE_TYPES = [
  'Basic',
  'OG',
  'Metal Casket',
  'High End',
] as const;

export type PackageType = CreatePackageQuery['packagetype'];

/** Controlled-input draft of a to-be-created package; numeric fields stay strings until submit. */
export interface PackageDraft {
  packagename: string;
  packagetype: PackageType | '';
  price: string;
  embalmingperiod: string;
  inclusions: string;
}

export function initialPackageDraft(): PackageDraft {
  return {
    packagename: '',
    packagetype: '',
    price: '',
    embalmingperiod: '',
    inclusions: '',
  };
}

export function isPackageDraftComplete(draft: PackageDraft): boolean {
  return (
    draft.packagename.trim() !== '' &&
    draft.packagetype !== '' &&
    draft.price.trim() !== '' &&
    Number(draft.price) >= 0 &&
    draft.embalmingperiod.trim() !== '' &&
    Number(draft.embalmingperiod) >= 0
  );
}

/**
 * Converts a complete draft into the `POST /packages` payload, or `null` if
 * it isn't complete yet.
 */
export function toCreatePackageQuery(
  draft: PackageDraft,
): CreatePackageQuery | null {
  if (!isPackageDraftComplete(draft)) return null;

  return {
    packagename: draft.packagename.trim(),
    packagetype: draft.packagetype as PackageType,
    price: Number(draft.price),
    embalmingperiod: Number(draft.embalmingperiod),
    inclusions: emptyToNull(draft.inclusions),
  };
}
