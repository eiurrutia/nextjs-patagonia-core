import { lusitana } from '@/app/ui/fonts';
import Image from 'next/image';

interface PatagoniaLogoProps {
  className?: string;
}

export default function PatagoniaLogo({ className }: PatagoniaLogoProps) {
  return (
    <div
      className={`${lusitana.className} flex flex-row items-center leading-none text-white ${className}`}
    >
      <Image
        src="/patagonia_logo_bear.png"
        width={300}
        height={300}
        alt="Patagonia Logo"
        priority
        className="max-w-full max-h-full"
      />
    </div>
  );
}
