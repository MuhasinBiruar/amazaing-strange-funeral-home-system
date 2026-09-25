'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { PackageWithCasket } from 'shared';
import { getCasketPackages } from '@/services/casketInventoryService';
import { formatCurrency, titleCase } from '@/utils/format';
import SidePanel from '@/components/sidePanel';
import { useSidePanel } from '@/components/sidePanel/useSidePanel';

export default function PackagesPanel({
  casketid,
  caskettype,
  onClose,
}: {
  casketid: number;
  caskettype: string;
  onClose: () => void;
}) {
  const { isShown, requestClose } = useSidePanel(onClose);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [packages, setPackages] = useState<PackageWithCasket[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPackages() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const allPackages = await getCasketPackages(
          casketid,
          controller.signal,
        );
        if (controller.signal.aborted) return;

        setPackages(allPackages);
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error('Failed to load casket packages:', error);
        setLoadError('Could not load packages. Try again.');
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadPackages();
    return () => controller.abort();
  }, [casketid]);

  return (
    <SidePanel
      shown={isShown}
      onRequestClose={requestClose}
      ariaLabel={`Packages using ${caskettype}`}
      badge="CASKET PACKAGES"
      badgeClassName="bg-blue-100 text-blue-800"
      title={caskettype}
      subtitle="Packages that include this casket"
    >
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            Loading packages...
          </div>
        )}

        {!isLoading && loadError && (
          <p className="text-sm text-red-500">{loadError}</p>
        )}

        {!isLoading && !loadError && packages.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-500">
            No packages currently use this casket.
          </p>
        )}

        {!isLoading && !loadError && packages.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {packages.length} {packages.length === 1 ? 'package' : 'packages'}
            </p>
            {packages.map((pkg) => (
              <article
                key={pkg.packageid}
                className="rounded-lg border border-gray-200 bg-gray-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {pkg.packagename}
                    </h3>
                    <p className="mt-1 text-xs font-medium text-blue-700">
                      {titleCase(pkg.packagetype)}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold text-gray-900">
                    {formatCurrency(pkg.price)}
                  </span>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-200 pt-3 text-sm">
                  <div>
                    <dt className="text-xs text-gray-500">Embalming</dt>
                    <dd className="mt-0.5 font-medium text-gray-800">
                      {pkg.embalmingperiod} days
                    </dd>
                  </div>
                </dl>

                {pkg.inclusions && (
                  <div className="mt-3 border-t border-gray-200 pt-3">
                    <dt className="text-xs text-gray-500">Inclusions</dt>
                    <dd className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                      {pkg.inclusions}
                    </dd>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </SidePanel>
  );
}
