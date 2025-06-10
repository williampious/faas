import Image from 'next/image';
import Link from 'next/link';

export function AppLogo() {
  return (
    <Link href="/" className="flex items-center gap-2 px-2 group">
      <div className="relative h-12 w-48 md:h-14 md:w-56">
        <Image
          src="/agrifaas-logo.png" // Assumes agrifaas-logo.png is in /public
          alt="AgriFAAS Connect Logo"
          layout="fill"
          objectFit="contain"
          priority
        />
      </div>
    </Link>
  );
}
