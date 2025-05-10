'use client';
import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import InOmsNoErpDifferenceCard from '@/app/ui/dashboard/in-oms-no-erp-difference-card';
import InShopifyNoOmsDifferenceCard from '@/app/ui/dashboard/in-shopify-no-oms-difference-card';
import QuantityDiscrepancyCard from '@/app/ui/dashboard/quantity-discrepanciy-card';
import OpenedIncidencesCard from '@/app/ui/dashboard/opened-incidences-card';
import { lusitana } from '@/app/ui/fonts';
import { Suspense } from 'react';
import { CardSkeleton } from '@/app/ui/skeletons';
import { format, subMonths } from 'date-fns';

export default function AnalyticsDashboard() {
    const [startDate, setStartDate] = useState(subMonths(new Date(), 1));
    const [endDate, setEndDate] = useState(new Date());

    return (
        <main className="p-6">
            <h1 className={`${lusitana.className} mb-8 text-2xl md:text-3xl`}>
                Dashboard
            </h1>
            <div className="flex flex-wrap gap-4 mb-4">
                <div className="w-full sm:w-auto">
                    <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">Fecha Inicio</label>
                    <DatePicker
                        id="start-date"
                        selected={startDate}
                        onChange={(date: Date) => setStartDate(date)}
                        dateFormat="yyyy/MM/dd"
                        className="form-input rounded"
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                    />
                </div>
                <div className="w-full sm:w-auto">
                    <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">Fecha Término</label>
                    <DatePicker
                        id="end-date"
                        selected={endDate}
                        onChange={(date: Date) => setEndDate(date)}
                        dateFormat="yyyy/MM/dd"
                        className="form-input rounded"
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate}
                    />
                </div>
            </div>
            <h2 className={`${lusitana.className} mb-4 mt-8 text-xl md:text-2xl`}>
                Diferencias entre Sistemas
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <Suspense fallback={<CardSkeleton />}>
                    <InShopifyNoOmsDifferenceCard
                        startDate={format(startDate, 'yyyy/MM/dd')}
                        endDate={format(endDate, 'yyyy/MM/dd')} />
                </Suspense>
                <Suspense fallback={<CardSkeleton />}>
                    <InOmsNoErpDifferenceCard
                        startDate={format(startDate, 'yyyy/MM/dd')}
                        endDate={format(endDate, 'yyyy/MM/dd')} />
                </Suspense>
                <Suspense fallback={<CardSkeleton />}>
                    <QuantityDiscrepancyCard
                        startDate={format(startDate, 'yyyy/MM/dd')}
                        endDate={format(endDate, 'yyyy/MM/dd')} />
                </Suspense>
            </div>
            <h2 className={`${lusitana.className} mb-4 mt-8 text-xl md:text-2xl`}>
                Incidencias
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <Suspense fallback={<CardSkeleton />}>
                    <OpenedIncidencesCard
                        startDate={format(startDate, 'yyyy/MM/dd')}
                        endDate={format(endDate, 'yyyy/MM/dd')} />
                </Suspense>
            </div>
        </main>
    );
}
