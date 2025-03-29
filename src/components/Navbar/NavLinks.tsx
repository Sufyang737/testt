"use client"
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { name: 'Dashboard', href: '/' },
  { name: 'Planes', href: '/playground' },
  { name: 'Configuración', href: '/settings' },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {links.map((link) => {
        const isHighlighted = 
        (link.name === 'Dashboard' && (pathname === '/' || pathname.startsWith('/dashboard'))) ||
        (link.name === 'Planes' && pathname.startsWith('/playground')) ||
        (link.name === 'Configuración' && pathname.startsWith('/settings'));

        return (
          <Link
            key={link.name}
            href={link.href}
            className={`text-base max-xl:text-sm font-mulish transition-all duration-150 px-3 py-2 rounded-lg relative 
              ${isHighlighted 
                ? "text-primary font-medium bg-primary/5" 
                : "text-gray-600 hover:text-primary hover:bg-primary/5"
              }
              after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:bg-primary 
              after:transition-all after:duration-300 
              ${isHighlighted ? "after:w-2/3" : "after:w-0 hover:after:w-1/2"}
            `}
          >
            {link.name}
          </Link>
        );
      })}
    </>
  );
}