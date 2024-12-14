'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useDebouncedCallback } from 'use-debounce';

export default function TableSearch({
  placeholder,
  onSearch,
}: {
  placeholder: string;
  onSearch: (term: string) => void;
}) {
  const handleSearch = useDebouncedCallback((term: string) => {
    onSearch(term);
  }, 300);

  return (
    <div className="relative flex items-center mb-4">
      <label htmlFor="table-search" className="sr-only">
        Buscar
      </label>
      <input
        id="table-search"
        type="text"
        className="block w-full rounded-md border border-gray-200 py-2 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={placeholder}
        onChange={(e) => handleSearch(e.target.value)}
      />
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
    </div>
  );
}
