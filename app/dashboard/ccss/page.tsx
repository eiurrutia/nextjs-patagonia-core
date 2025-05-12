'use client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { lusitana } from '@/app/ui/fonts';
import { DocumentDuplicateIcon, UserGroupIcon, BellAlertIcon } from '@heroicons/react/24/outline';

export default function CcssPage() {
  const router = useRouter();
  
  // Define las secciones para CCSS
  const sections = [
    {
      title: 'Ordenes',
      description: 'Gestiona y monitorea todas las órdenes de los clientes.',
      route: '/orders',
      color: 'bg-blue-500',
      icon: DocumentDuplicateIcon,
    },
    {
      title: 'Clientes',
      description: 'Administra la información de los clientes y sus historiales.',
      route: '/customers',
      color: 'bg-purple-500',
      icon: UserGroupIcon,
    },
    {
      title: 'Incidencias',
      description: 'Visualiza y gestiona las incidencias reportadas por los clientes.',
      route: '/incidences',
      color: 'bg-red-500',
      icon: BellAlertIcon,
    },
  ];

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex flex-col items-center mb-12">
        <h1 className={`${lusitana.className} text-4xl md:text-5xl font-bold text-center mb-4`}>
          Centro de Control y Servicio al Cliente
        </h1>
        <p className="text-xl text-gray-600 text-center max-w-2xl">
          Gestiona Órdenes, Clientes e Incidencias en un solo lugar, centralizando 
          toda la información relevante para el servicio al cliente.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {sections.map((section) => (
          <div
            key={section.title}
            onClick={() => router.push(section.route)}
            className={`flex flex-col items-center justify-center p-8 rounded-lg shadow-lg cursor-pointer ${section.color} text-white transform hover:scale-105 transition-transform duration-300 h-64`}
          >
            <section.icon className="h-16 w-16 mb-4" />
            <h2 className="text-2xl font-bold mb-2">{section.title}</h2>
            <p className="text-center">{section.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
