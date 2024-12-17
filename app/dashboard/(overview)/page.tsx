'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import InOmsNoErpDifferenceCard from '@/app/ui/dashboard/in-oms-no-erp-difference-card';
import InShopifyNoOmsDifferenceCard from '@/app/ui/dashboard/in-shopify-no-oms-difference-card';
import QuantityDiscrepancyCard from '@/app/ui/dashboard/quantity-discrepanciy-card';
import OpenedIncidencesCard from '@/app/ui/dashboard/opened-incidences-card';
import { UserGroupIcon, RectangleGroupIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';
import { Suspense } from 'react';
import { CardSkeleton } from '@/app/ui/skeletons';
import { format, subMonths } from 'date-fns';
 
 
export default function Page() {
    const [startDate, setStartDate] = useState(subMonths(new Date(), 1));
    const [endDate, setEndDate] = useState(new Date());
    const router = useRouter();

    const sections = [
        {
            title: 'CCSS',
            description: 'Accede a la gestión de CCSS.',
            route: '/ccss',
            color: 'bg-blue-500',
            icon: UserGroupIcon,
        },
        {
            title: 'STOCK PLANNING',
            description: 'Planifica y gestiona el stock.',
            route: '/stock-planning',
            color: 'bg-green-500',
            icon: RectangleGroupIcon,
        },
        {
            title: 'TRADE-IN',
            description: 'Gestiona las operaciones de trade-in.',
            route: '/trade-in',
            color: 'bg-yellow-500',
            icon: ArrowPathIcon,
        },
    ];

    return (
        <main>
        
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className={`${lusitana.className} mb-8 text-8xl font-bold  md:text-6xl`}>
                Patagonia Core
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
                {sections.map((section) => (
                    <div
                        key={section.title}
                        onClick={() => router.push(section.route)}
                        className={`flex flex-col items-center justify-center h-48 rounded-lg shadow-lg cursor-pointer ${section.color} text-white transform hover:scale-105 transition-transform`}
                    >
                        <section.icon className="h-12 w-12 mb-4 text-white" />
                        <h2 className="text-2xl font-bold">{section.title}</h2>
                        <p className="mt-2 text-center px-4">{section.description}</p>
                    </div>
                ))}
            </div>
        </div>
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
        <h2 className={`${lusitana.className} mb-4 mt-20 text-xl md:text-2xl`}>
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
        <h2 className={`${lusitana.className} mb-4 mt-20 text-xl md:text-2xl`}>
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