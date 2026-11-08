import { Skeleton } from 'primereact/skeleton';

function FieldSkeleton({ width = '100%' }: { width?: string }) {
  return (
    <div className="space-y-1">
      <Skeleton width="6rem" height="0.7rem" />
      <Skeleton width={width} height="2.625rem" />
    </div>
  );
}

function SectionSkeleton({
  children,
  titleWidth = '9rem',
}: {
  children: React.ReactNode;
  titleWidth?: string;
}) {
  return (
    <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton shape="circle" size="1.25rem" />
        <Skeleton width={titleWidth} height="1.375rem" />
      </div>
      {children}
    </section>
  );
}

export default function Loading() {
  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col pb-24"
      aria-label="Loading intake form"
      aria-busy="true"
    >
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 space-y-6">
        <header>
          <Skeleton width="8rem" height="1.25rem" className="mb-2" />
          <Skeleton width="15rem" height="2.25rem" className="mb-2" />
          <Skeleton width="100%" height="1rem" />
          <Skeleton width="82%" height="1rem" className="mt-1" />
        </header>

        <SectionSkeleton titleWidth="10rem">
          <div className="space-y-4">
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton width="55%" />
            <FieldSkeleton />
            <FieldSkeleton />
            <div className="space-y-1">
              <Skeleton width="11rem" height="0.7rem" />
              <Skeleton width="100%" height="5rem" />
            </div>
          </div>
        </SectionSkeleton>

        <SectionSkeleton titleWidth="12rem">
          <div className="space-y-3">
            <Skeleton width="9rem" height="0.7rem" />
            <Skeleton width="100%" height="7.5rem" />
            <div className="flex items-start gap-2">
              <Skeleton width="1rem" height="1rem" />
              <div className="space-y-1">
                <Skeleton width="15rem" height="0.875rem" />
                <Skeleton width="20rem" height="0.75rem" />
              </div>
            </div>
          </div>
        </SectionSkeleton>

        <SectionSkeleton titleWidth="11rem">
          <div className="space-y-4">
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
            <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-3">
              <Skeleton width="1rem" height="1rem" />
              <div className="space-y-1">
                <Skeleton width="14rem" height="0.875rem" />
                <Skeleton width="19rem" height="0.75rem" />
              </div>
            </div>
          </div>
        </SectionSkeleton>

        <SectionSkeleton titleWidth="11rem">
          <div className="flex items-center justify-between">
            <Skeleton width="13rem" height="0.875rem" />
            <Skeleton width="5rem" height="1.5rem" />
          </div>
          <div className="space-y-3">
            <Skeleton width="100%" height="3.25rem" />
            <Skeleton width="100%" height="3.25rem" />
          </div>
          <Skeleton width="100%" height="2.625rem" />
        </SectionSkeleton>

        <SectionSkeleton titleWidth="15rem">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
            <div className="space-y-1">
              <Skeleton width="9rem" height="0.7rem" />
              <Skeleton width="100%" height="5rem" />
            </div>
          </div>
        </SectionSkeleton>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton width="3rem" height="0.7rem" />
            <Skeleton width="4rem" height="0.875rem" />
          </div>
          <div className="flex gap-3">
            <Skeleton width="5rem" height="2.5rem" />
            <Skeleton width="7rem" height="2.5rem" />
          </div>
        </div>
      </div>
    </div>
  );
}
