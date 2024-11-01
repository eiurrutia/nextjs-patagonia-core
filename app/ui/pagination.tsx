'use client';

import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { generatePagination } from '@/app/lib/utils';

export default function Pagination({
  totalPages,
  currentPage,
  setPage,
}: {
  totalPages: number;
  currentPage: number;
  setPage: (page: number) => void;
}) {
  const allPages = generatePagination(currentPage, totalPages);

  const goToPage = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setPage(pageNumber);
    }
  };

  return (
    <div className="inline-flex">
      <PaginationArrow
        direction="left"
        onClick={() => goToPage(currentPage - 1)}
        isDisabled={currentPage <= 1}
      />

      <div className="flex -space-x-px">
        {allPages.map((page, index) => {
          let position: 'first' | 'last' | 'single' | 'middle' | undefined;
          if (index === 0) position = 'first';
          if (index === allPages.length - 1) position = 'last';
          if (allPages.length === 1) position = 'single';
          if (page === '...') position = 'middle';

          return (
            <PaginationNumber
              key={page}
              page={page}
              position={position}
              isActive={currentPage === page}
              onClick={() => typeof page === 'number' && goToPage(page)}
            />
          );
        })}
      </div>

      <PaginationArrow
        direction="right"
        onClick={() => goToPage(currentPage + 1)}
        isDisabled={currentPage >= totalPages}
      />
    </div>
  );
}

function PaginationNumber({
  page,
  isActive,
  position,
  onClick,
}: {
  page: number | string;
  position?: 'first' | 'last' | 'middle' | 'single';
  isActive: boolean;
  onClick: () => void;
}) {
  const className = clsx(
    'flex h-10 w-10 items-center justify-center text-sm border',
    {
      'rounded-l-md': position === 'first' || position === 'single',
      'rounded-r-md': position === 'last' || position === 'single',
      'z-10 bg-blue-600 border-blue-600 text-white': isActive,
      'hover:bg-gray-100 cursor-pointer': !isActive && position !== 'middle',
      'text-gray-300': position === 'middle',
    },
  );

  return position === 'middle' ? (
    <div className={className}>{page}</div>
  ) : (
    <div onClick={onClick} className={className}>
      {page}
    </div>
  );
}

function PaginationArrow({
  direction,
  isDisabled,
  onClick,
}: {
  direction: 'left' | 'right';
  isDisabled?: boolean;
  onClick: () => void;
}) {
  const className = clsx(
    'flex h-10 w-10 items-center justify-center rounded-md border',
    {
      'pointer-events-none text-gray-300': isDisabled,
      'hover:bg-gray-100 cursor-pointer': !isDisabled,
      'mr-2 md:mr-4': direction === 'left',
      'ml-2 md:ml-4': direction === 'right',
    },
  );

  const icon =
    direction === 'left' ? (
      <ArrowLeftIcon className="w-4" />
    ) : (
      <ArrowRightIcon className="w-4" />
    );

  return <div className={className} onClick={onClick}>{icon}</div>;
}
