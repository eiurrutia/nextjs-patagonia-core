'use client';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';

export default function PeriodFilter() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const handleStatusChange = useDebouncedCallback((newPeriod) => {
        const params = new URLSearchParams(searchParams || '');
        if (newPeriod !== '3m') {
        params.set('period', newPeriod);
        } else {
        params.delete('period');
        }
        replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, 300);

    return (
        <div className="flex justify-end flex-1">
        <label htmlFor="period-filter" className="sr-only">
            Periodo
        </label>
        <select
            id="period-filter"
            name="period-filter"
            defaultValue={searchParams?.get('period') || '3m'}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="block rounded-md border border-gray-200 py-2 pl-3 pr-10 bg-white text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
            <option value="1m">Último mes</option>
            <option value="3m">Últimos 3 meses</option>
            <option value="6m">Últimos 6 meses</option>
            <option value="12m">Últimos año</option>
            <option value="all">Histórico</option>
        </select>
        </div>
    );
}
