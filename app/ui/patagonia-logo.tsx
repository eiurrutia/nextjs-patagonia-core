import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';

export default function PatagoniaLogo() {
  return (
    <div
      className={`${lusitana.className} flex flex-row items-center leading-none text-white`}
    >
      <img src="/patagonia_logo_bear.png" alt="Patagonia Logo" className="max-w-full max-h-full" />
    </div>
  );
}
