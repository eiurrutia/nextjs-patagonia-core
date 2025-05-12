'use client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { UserGroupIcon, RectangleGroupIcon, ArrowPathIcon, ChartBarSquareIcon } from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';

export default function Page() {
    const router = useRouter();
    const { data: session, status } = useSession();

    const sections = [
        {
            title: 'CCSS',
            description: 'Accede a la gestión de CCSS.',
            route: '/ccss',
            color: 'bg-blue-500',
            icon: UserGroupIcon,
            roles: ['admin', 'user']
        },
        {
            title: 'STOCK PLANNING',
            description: 'Planifica y gestiona el stock.',
            route: '/stock-planning',
            color: 'bg-green-500',
            icon: RectangleGroupIcon,
            roles: ['admin']
        },
        {
            title: 'TRADE-IN',
            description: 'Gestiona las operaciones de trade-in.',
            route: '/trade-in',
            color: 'bg-yellow-500',
            icon: ArrowPathIcon,
            roles: ['admin']
        },
        {
            title: 'ANALYTICS',
            description: 'Accede a la gestión de analytics.',
            route: '/dashboard/analytics',
            color: 'bg-orange-500',
            icon: ChartBarSquareIcon,
            roles: ['admin', 'user']
        },
    ];

    if (status === 'loading') {
        return (
            <main>
                <div className="flex flex-col items-center justify-center min-h-screen">
                    <p className="text-xl">Cargando...</p>
                </div>
            </main>
        );
    }

    if (!session || !session.user || !session.user.role) {
        return null;
    }

    const userRole = session.user.role;
    const filteredSections = sections.filter(section => section.roles.includes(userRole));

    return (
        <main>
            <div className="flex flex-col items-center justify-center min-h-screen">
                <div className="mb-4 w-48 h-48">
                    <Image
                        src="/patagonia_logo_bear.png"
                        alt="Patagonia Logo"
                        width={192}
                        height={192}
                        className="object-contain"
                        priority
                    />
                </div>
                <h1 className={`${lusitana.className} mb-8 text-8xl font-bold md:text-6xl`}>
                    Patagonia Core
                </h1>
                {filteredSections.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
                        {filteredSections.map((section) => (
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
                ) : (
                    <p className="text-xl text-gray-600">No hay secciones disponibles para tu rol.</p>
                )}
            </div>
        </main>
    );
}