import { lusitana } from '@/app/ui/fonts';
import Image from 'next/image';

export default function PatagoniaLogo() {
  return (
    <div
      className={`${lusitana.className} flex flex-row items-center leading-none text-white`}
    >
      <Image
        src="/patagonia_logo_bear.png"
        width={300}
        height={300}
        alt="Patagonia Logo"
        priority
        className="mx-auto"
      />
    </div>
  );
}
