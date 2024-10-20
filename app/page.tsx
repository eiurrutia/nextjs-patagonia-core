import PatagoniaLogo from '@/app/ui/patagonia-logo';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { lusitana } from '@/app/ui/fonts';
import Image from 'next/image';

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col p-6">
      <div className="relative flex items-center rounded-lg bg-blue-500 md:h-64">
        <div className="absolute left-4 pl-8 flex items-center">
          <div className="h-full max-h-64 md:max-h-64">
            <PatagoniaLogo />
          </div>
        </div>
      </div>
      <div className="mt-4 flex grow flex-col gap-4 md:flex-row">
        <div className="flex flex-col justify-center gap-6 rounded-lg bg-gray-50 px-6 py-4 md:w-2/5 md:px-20">
        <p
            className={`${lusitana.className} text-xl text-gray-800 md:text-3xl md:leading-normal`}
          >
            <strong>Bienvenido a Patagonia Core!</strong> La solución propia de{' '}
            Patagonia Chile para centralizar la información de sus distintas plataformas.
          </p>
          <div className="h-0 w-0 border-b-[30px] border-l-[20px] border-r-[20px] border-b-black border-l-transparent border-r-transparent"/>
          <Link
            href="/login"
            className="flex items-center gap-5 self-start rounded-lg bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-400 md:text-base"
          >
            <span>Log in</span> <ArrowRightIcon className="w-5 md:w-6" />
          </Link>
        </div>
        <div className="flex items-center justify-center">
          <Image
            src="/fondo.png"
            width={1000}
            height={760}
            className="hidden md:block"
            alt="Screenshots of the dashboard project showing desktop version"
          />
          <Image
            src="/hero-mobile.png"
            width={560}
            height={620}
            className="block md:hidden"
            alt="Screenshot of the dashboard project showing mobile version"
          />
        </div>
      </div>
    </main>
  );
}
