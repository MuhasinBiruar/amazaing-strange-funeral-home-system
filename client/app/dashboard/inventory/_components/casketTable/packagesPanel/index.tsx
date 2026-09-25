'use client';

import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import type { PackageWithCasket } from 'shared';
import { getCasketPackages } from '@/services/casketInventoryService';
import { formatCurrency, titleCase } from '@/utils/format';

const PANEL_TRANSITION_MS = 300 as const;

export default function PackagesPanel({
  casketid,
  caskettype,
  onClose,
}: {
  casketid: number;
  caskettype: string;
  onClose: () => void;
}) {
  const [shown, setShown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [packages, setPackages] = useState<PackageWithCasket[]>([]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(frame);
  }, []);

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

  function handleClose() {
    setShown(false);
    setTimeout(onClose, PANEL_TRANSITION_MS);
  }

  return (
    <>
      <div
        onClick={handleClose}
        aria-hidden
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          shown ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Packages using ${caskettype}`}
        className={`fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-gray-200 bg-white shadow-xl transition-transform duration-300 ease-out sm:w-md ${
          shown ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200 px-5 py-4">
          <div>
            <span className="mb-1.5 inline-block rounded bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
              CASKET PACKAGES
            </span>
            <h2 className="font-serif text-lg font-bold text-gray-900">
              {caskettype}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Packages that include this casket
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close panel"
            className="shrink-0 cursor-pointer text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </header>

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
                {packages.length}{' '}
                {packages.length === 1 ? 'package' : 'packages'}
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
      </aside>
    </>
  );
}
