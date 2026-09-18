import type { CasketInventory, CreatePackageQuery, PackageWithCasket } from 'shared';
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
  casket: CasketInventory | null;
}

export function initialPackageDraft(): PackageDraft {
  return {
    packagename: '',
    packagetype: '',
    price: '',
    embalmingperiod: '',
    inclusions: '',
    casket: null,
  };
}

export function isPackageDraftComplete(draft: PackageDraft): boolean {
  return (
    draft.packagename.trim() !== '' &&
    draft.packagetype !== '' &&
    draft.price.trim() !== '' &&
    Number(draft.price) >= 0 &&
    draft.embalmingperiod.trim() !== '' &&
    Number(draft.embalmingperiod) >= 0 &&
    draft.casket !== null
  );
}

function toCreatePackageQuery(draft: PackageDraft): CreatePackageQuery | null {
  if (!isPackageDraftComplete(draft)) return null;

  return {
    packagename: draft.packagename.trim(),
    packagetype: draft.packagetype as PackageType,
    price: Number(draft.price),
    embalmingperiod: Number(draft.embalmingperiod),
    inclusions: emptyToNull(draft.inclusions),
    casketid: (draft.casket as CasketInventory).casketid,
  };
}

/**
 * A package ready to attach to the contract — either brand new
 * (`packageid: null`, created at submit time via `POST /packages`) or picked
 * from the existing catalog through the guided flow (`packageid` already
 * known, nothing to create).
 */
export type ConfirmedPackage = Omit<PackageWithCasket, 'packageid'> & {
  packageid: number | null;
};

/** Converts a complete draft into a to-be-created `ConfirmedPackage`, or `null` if it isn't complete yet. */
export function toConfirmedPackage(draft: PackageDraft): ConfirmedPackage | null {
  const query = toCreatePackageQuery(draft);
  if (!query) return null;

  const casket = draft.casket as CasketInventory;

  return {
    ...query,
    packageid: null,
    caskettype: casket.caskettype,
    casket_currentstock: casket.currentstock,
  };
}
