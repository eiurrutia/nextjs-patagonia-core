'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';

export default function StatusFilter() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const handleStatusChange = useDebouncedCallback((newStatus) => {
        const params = new URLSearchParams(searchParams || '');
        params.set('page', '1');
        if (newStatus !== 'all') {
        params.set('status', newStatus);
        } else {
        params.delete('status');
        }
        replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, 300);

    return (
        <div className="flex justify-end pb-8 flex-1">
        <label htmlFor="status-filter" className="sr-only">
            Estado
        </label>
        <select
            id="status-filter"
            name="status-filter"
            defaultValue={searchParams?.get('status') || 'all'}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="block rounded-md border border-gray-200 py-2 pl-3 pr-10 bg-white text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
            <option value="all">Todas</option>
            <option value="abierta">Abierta</option>
            <option value="cerrada">Cerrada</option>
        </select>
        </div>
    );
}
