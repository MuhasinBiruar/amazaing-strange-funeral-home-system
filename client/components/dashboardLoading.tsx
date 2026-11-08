import { Skeleton } from 'primereact/skeleton';

export default function DashboardLoading() {
  return (
    <main
      className="min-h-screen bg-gray-50"
      aria-label="Loading dashboard"
      aria-busy="true"
    >
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-7 sm:mb-9">
          <Skeleton width="7rem" height="1.25rem" className="mb-2" />
          <Skeleton width="8rem" height="2.25rem" className="mb-2" />
          <Skeleton width="15rem" height="1rem" />
        </header>

        <div className="space-y-7">
          {[3, 2, 1, 2].map((rowCount, sectionIndex) => (
            <section key={sectionIndex}>
              <Skeleton width="5.5rem" height="0.75rem" className="mb-2" />
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                {Array.from({ length: rowCount }, (_, rowIndex) => (
                  <div
                    key={rowIndex}
                    className={`flex items-center gap-3 px-4 py-4 sm:px-5 ${
                      rowIndex < rowCount - 1 ? 'border-b border-gray-200' : ''
                    }`}
                  >
                    <Skeleton width="2.25rem" height="2.25rem" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Skeleton width="9rem" height="0.875rem" />
                      <Skeleton width="13rem" height="0.75rem" />
                    </div>
                    <Skeleton width="1.125rem" height="1.125rem" />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
