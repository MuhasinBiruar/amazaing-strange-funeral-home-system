import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';

export default function TableFooter({
  page,
  setPage,
  total,
  limit,
}: {
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  total: number;
  limit: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      if (page <= 4) {
        pageNumbers.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (page >= totalPages - 3) {
        pageNumbers.push(
          1,
          '...',
          totalPages - 4,
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        );
      } else {
        pageNumbers.push(1, '...', page - 1, page, page + 1, '...', totalPages);
      }
    }

    return pageNumbers;
  };

  return (
    <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
      <span className="text-xs text-gray-400">
        Page {page} of {totalPages}
      </span>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="flex items-center gap-1 text-sm border border-gray-200 rounded-md px-2 py-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {getPageNumbers().map((p, index) => {
          if (p === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-1 text-gray-400 text-sm"
              >
                ...
              </span>
            );
          }

          const isCurrent = page === p;
          return (
            <button
              key={`page-${p}`}
              onClick={() => setPage(p as number)}
              className={`text-sm rounded-md px-3 py-1.5 min-w-8 transition-colors ${
                isCurrent
                  ? 'bg-indigo-600 text-white font-medium hover:bg-indigo-500'
                  : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          );
        })}

        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="flex items-center gap-1 text-sm border border-gray-200 rounded-md px-2 py-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
